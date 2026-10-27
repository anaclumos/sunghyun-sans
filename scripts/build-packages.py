# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NFPM = "nfpm@2.48.0"
MAINTAINER = "Sunghyun Cho <hey@cho.sh>"
HOMEPAGE = "https://github.com/anaclumos/sunghyun-sans"
FORMATS = {
    "deb": {
        "name": "fonts-{slug}",
        "file": "fonts-{slug}_all.deb",
        "fonts": "/usr/share/fonts/opentype/{slug}",
        "license": "/usr/share/doc/fonts-{slug}/copyright",
    },
    "rpm": {
        "name": "{slug}-fonts",
        "file": "{slug}-fonts.noarch.rpm",
        "fonts": "/usr/share/fonts/{slug}",
        "license": "/usr/share/licenses/{slug}-fonts/LICENSE",
    },
    "archlinux": {
        "name": "otf-{slug}",
        "file": "otf-{slug}-any.pkg.tar.zst",
        "fonts": "/usr/share/fonts/OTF",
        "license": "/usr/share/licenses/otf-{slug}/LICENSE",
    },
}


def words(family: str) -> list[str]:
    return re.findall(r"[A-Z][a-z]+|[A-Z]+(?![a-z])", family)


def families(fonts: Path) -> dict[str, list[Path]]:
    found: dict[str, list[Path]] = {}
    for path in sorted(fonts.glob("*-*.otf")):
        found.setdefault(path.stem.rsplit("-", 1)[0], []).append(path)
    if not found:
        sys.exit(f"no Family-Style.otf files in {fonts}")
    for family in found:
        if "".join(words(family)) != family:
            sys.exit(f"{family}: a family name must be CamelCase letters")
    return found


def debian_copyright(license_text: str, name: str) -> str:
    header = license_text.split("SIL OPEN FONT LICENSE", 1)[0]
    holders = [line.strip().rstrip(",") for line in header.splitlines() if line.startswith("Copyright")]
    body = [f" {line}" if line.strip() else " ." for line in license_text.rstrip("\n").splitlines()]
    return "\n".join(
        [
            "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/",
            f"Upstream-Name: {name}",
            f"Upstream-Contact: {MAINTAINER}",
            f"Source: {HOMEPAGE}",
            "",
            "Files: *",
            "Copyright: " + "\n ".join(holders or ["The Sunghyun Sans Project Authors"]),
            "License: OFL-1.1",
            "",
            "License: OFL-1.1",
            *body,
            "",
        ]
    )


def config(family: str, files: list[Path], license_file: Path, version: str, packager: str) -> dict:
    slug = "-".join(word.lower() for word in words(family))
    layout = FORMATS[packager]
    name = " ".join(words(family))
    font_dir = layout["fonts"].format(slug=slug)
    license_path = layout["license"].format(slug=slug)
    contents = [{"src": str(path), "dst": f"{font_dir}/{path.name}", "file_info": {"mode": 0o644}} for path in files]
    license_entry = {"src": str(license_file), "dst": license_path, "file_info": {"mode": 0o644}}
    if packager == "rpm":
        license_entry["type"] = "license"
        contents += [
            {"dst": directory, "type": "dir", "file_info": {"mode": 0o755}}
            for directory in (font_dir, license_path.rsplit("/", 1)[0])
        ]
    contents.append(license_entry)
    return {
        "name": layout["name"].format(slug=slug),
        "arch": "all",
        "platform": "linux",
        "version": version,
        "release": "1",
        "section": "fonts",
        "priority": "optional",
        "maintainer": MAINTAINER,
        "vendor": "Sunghyun Cho",
        "homepage": HOMEPAGE,
        "license": "OFL-1.1",
        "description": (
            f"{name}, an open-source rounded font family\n"
            f"The {len(files)} static OpenType weights of {name}, "
            "an open-source alternative to SF Pro Rounded."
        ),
        "contents": contents,
        "archlinux": {"packager": MAINTAINER},
    }


def build(job: tuple[dict, str, Path, Path]) -> str:
    spec, packager, workdir, target = job
    config_file = workdir / f"{target.name}.json"
    config_file.write_text(json.dumps(spec))
    subprocess.run(
        ["mise", "exec", NFPM, "--", "nfpm", "package", "--config", str(config_file), "--packager", packager, "--target", str(target)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return f"{target.name}: {target.stat().st_size} bytes"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a .deb, .rpm, and Arch Linux package of each family's static OTFs.")
    parser.add_argument(
        "version",
        nargs="?",
        default=os.environ.get("SUNGHYUN_SANS_VERSION"),
        help="release version, such as 1.2.0 or v1.2.0 (default: $SUNGHYUN_SANS_VERSION)",
    )
    parser.add_argument("--fonts", type=Path, default=ROOT / "fonts" / "otf", help="directory of Family-Style.otf files")
    parser.add_argument("--license", type=Path, default=ROOT / "LICENSE", help="license file each package installs")
    parser.add_argument("--out", type=Path, default=ROOT / "release", help="directory the packages are written to")
    args = parser.parse_args()

    if not args.version:
        sys.exit("pass the release version, such as 1.2.0, or set SUNGHYUN_SANS_VERSION")
    version = args.version.removeprefix("v")
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        sys.exit(f"{args.version}: the version must look like 1.2.0")
    if not args.license.is_file():
        sys.exit(f"{args.license}: no license file")
    found = families(args.fonts)

    args.out.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".packages-", dir=args.out))
    try:
        jobs = []
        license_text = args.license.read_text()
        for family, files in found.items():
            slug = "-".join(word.lower() for word in words(family))
            copyright_file = staging / f"{slug}.copyright"
            copyright_file.write_text(debian_copyright(license_text, " ".join(words(family))))
            for packager, layout in FORMATS.items():
                license_file = copyright_file if packager == "deb" else args.license.resolve()
                spec = config(family, files, license_file, version, packager)
                jobs.append((spec, packager, staging, staging / layout["file"].format(slug=slug)))
        with ThreadPoolExecutor() as pool:
            for line in pool.map(build, jobs):
                print(line)
        for _, _, _, target in jobs:
            target.replace(args.out / target.name)
    finally:
        shutil.rmtree(staging)


if __name__ == "__main__":
    main()
