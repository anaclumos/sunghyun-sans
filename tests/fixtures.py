import io
import lzma
import gzip
import bz2
import os
import struct
import subprocess
import tarfile
import tempfile
from compression import zstd
from pathlib import Path

CHECKOUT = Path(__file__).resolve().parent.parent
SCRIPT = CHECKOUT / "scripts" / "build-packages.py"
REAL_FONTS = CHECKOUT / "fonts" / "otf"
REAL_LICENSE = CHECKOUT / "LICENSE"

RPMFILE_LICENSE = 1 << 7


def package_names(slug):
    return {
        "deb": f"fonts-{slug}_all.deb",
        "rpm": f"{slug}-fonts.noarch.rpm",
        "arch": f"otf-{slug}-any.pkg.tar.zst",
    }


def run_build(*args, env_version=None, cwd=None):
    env = {k: v for k, v in os.environ.items() if k != "SUNGHYUN_SANS_VERSION"}
    if env_version is not None:
        env["SUNGHYUN_SANS_VERSION"] = env_version
    return subprocess.run(
        ["uv", "run", str(SCRIPT), *args],
        cwd=cwd or CHECKOUT,
        env=env,
        capture_output=True,
        text=True,
        timeout=900,
    )


class TempDir:
    def __init__(self):
        self._dir = tempfile.TemporaryDirectory(prefix="ss-pkg-test-")
        self.path = Path(self._dir.name)

    def cleanup(self):
        self._dir.cleanup()


def make_fonts(directory, families):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    written = {}
    for family, styles in families.items():
        for style in styles:
            name = f"{family}-{style}.otf"
            content = f"OTTO fake {family} {style} ".encode() + os.urandom(64)
            (directory / name).write_bytes(content)
            written[name] = content
    return written


def make_license(path, text="Fake license for tests\nSIL Open Font License 1.1\n"):
    path = Path(path)
    path.write_bytes(text.encode())
    return text.encode()


def snapshot(directory):
    directory = Path(directory)
    if not directory.exists():
        return None
    return {
        str(p.relative_to(directory)): p.read_bytes()
        for p in sorted(directory.rglob("*"))
        if p.is_file() or p.is_symlink()
    } | {
        str(p.relative_to(directory)) + "/": b""
        for p in sorted(directory.rglob("*"))
        if p.is_dir()
    }


def _normalize(name):
    if name.startswith("./"):
        name = name[1:]
    if not name.startswith("/"):
        name = "/" + name
    return name


def _tar_files(data):
    files = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:*") as tar:
        for member in tar.getmembers():
            if member.isfile():
                files[_normalize(member.name)] = tar.extractfile(member).read()
    return files


def _ar_members(data):
    if not data.startswith(b"!<arch>\n"):
        raise ValueError("not an ar archive")
    members = {}
    offset = 8
    while offset + 60 <= len(data):
        header = data[offset : offset + 60]
        name = header[:16].decode().strip().rstrip("/")
        size = int(header[48:58].decode().strip())
        start = offset + 60
        members[name] = data[start : start + size]
        offset = start + size + (size % 2)
    return members


def _control_fields(text):
    fields = {}
    key = None
    for line in text.splitlines():
        if line[:1] in (" ", "\t") and key:
            fields[key] += "\n" + line.strip()
        elif ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            fields[key] = value.strip()
    return fields


def read_deb(path):
    members = _ar_members(Path(path).read_bytes())
    control_name = next(n for n in members if n.startswith("control.tar"))
    data_name = next(n for n in members if n.startswith("data.tar"))
    control_files = _tar_files(members[control_name])
    control = _control_fields(control_files["/control"].decode())
    return {
        "debian-binary": members["debian-binary"],
        "control": control,
        "control_files": control_files,
        "files": _tar_files(members[data_name]),
    }


def _rpm_header(data, offset):
    if data[offset : offset + 3] != b"\x8e\xad\xe8":
        raise ValueError("bad rpm header magic")
    nindex, hsize = struct.unpack(">II", data[offset + 8 : offset + 16])
    index_start = offset + 16
    store = index_start + 16 * nindex
    tags = {}
    for i in range(nindex):
        tag, kind, off, count = struct.unpack(
            ">iiii", data[index_start + 16 * i : index_start + 16 * (i + 1)]
        )
        pos = store + off
        if kind == 6 or (kind == 9 and count == 1):
            end = data.index(b"\0", pos)
            value = data[pos:end].decode()
        elif kind in (8, 9):
            value = []
            for _ in range(count):
                end = data.index(b"\0", pos)
                value.append(data[pos:end].decode())
                pos = end + 1
        elif kind == 4:
            value = list(struct.unpack(f">{count}i", data[pos : pos + 4 * count]))
        elif kind == 3:
            value = list(struct.unpack(f">{count}h", data[pos : pos + 2 * count]))
        elif kind == 5:
            value = list(struct.unpack(f">{count}q", data[pos : pos + 8 * count]))
        elif kind in (1, 2, 7):
            value = data[pos : pos + count]
        else:
            value = None
        tags[tag] = value
    return tags, store + hsize


def _decompress(payload):
    if payload.startswith(b"\x1f\x8b"):
        return gzip.decompress(payload)
    if payload.startswith(b"\xfd7zXZ"):
        return lzma.decompress(payload)
    if payload.startswith(b"\x28\xb5\x2f\xfd"):
        return zstd.decompress(payload)
    if payload.startswith(b"BZh"):
        return bz2.decompress(payload)
    return payload


def _cpio_files(data):
    files = {}
    offset = 0
    while offset < len(data):
        magic = data[offset : offset + 6]
        if magic not in (b"070701", b"070702"):
            raise ValueError("unsupported cpio format")
        fields = [
            int(data[offset + 6 + 8 * i : offset + 14 + 8 * i], 16) for i in range(13)
        ]
        mode, filesize, namesize = fields[1], fields[6], fields[11]
        name_start = offset + 110
        name = data[name_start : name_start + namesize - 1].decode()
        data_start = name_start + namesize
        data_start += (-data_start) % 4
        if name == "TRAILER!!!":
            break
        if (mode & 0o170000) == 0o100000:
            files[_normalize(name)] = data[data_start : data_start + filesize]
        offset = data_start + filesize
        offset += (-offset) % 4
    return files


def read_rpm(path):
    data = Path(path).read_bytes()
    if data[:4] != b"\xed\xab\xee\xdb":
        raise ValueError("not an rpm")
    _, end = _rpm_header(data, 96)
    end += (-end) % 8
    tags, payload_start = _rpm_header(data, end)
    if 1117 in tags:
        dirs = tags[1118]
        paths = [dirs[i] + base for i, base in zip(tags[1116], tags[1117], strict=True)]
    else:
        paths = tags.get(1027, [])
    flags = dict(zip(paths, tags.get(1037, [0] * len(paths)), strict=True))
    return {
        "name": tags.get(1000),
        "version": tags.get(1001),
        "release": tags.get(1002),
        "license": tags.get(1014),
        "arch": tags.get(1022),
        "file_flags": flags,
        "files": _cpio_files(_decompress(data[payload_start:])),
    }


def read_arch(path):
    files = _tar_files(zstd.decompress(Path(path).read_bytes()))
    info = {}
    for line in files["/.PKGINFO"].decode().splitlines():
        if " = " in line and not line.startswith("#"):
            key, value = line.split(" = ", 1)
            info.setdefault(key.strip(), []).append(value.strip())
    payload = {k: v for k, v in files.items() if not k.split("/")[1].startswith(".")}
    return {"info": info, "files": payload, "all_files": files}


def font_files(files, directory):
    prefix = directory.rstrip("/") + "/"
    return {
        name[len(prefix) :]: content
        for name, content in files.items()
        if name.startswith(prefix) and name.endswith(".otf")
    }


def otf_files(files):
    return {name: content for name, content in files.items() if name.endswith(".otf")}


def listing(directory):
    directory = Path(directory)
    if not directory.exists():
        return None
    return {p.name for p in directory.iterdir()}


def package_files_under(root):
    root = Path(root)
    suffixes = (".deb", ".rpm", ".pkg.tar.zst")
    return [p for p in root.rglob("*") if p.name.endswith(suffixes)]
