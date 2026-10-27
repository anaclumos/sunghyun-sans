# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

from __future__ import annotations

import shutil
import sys
import zipfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"
RELEASE = ROOT / "release"
ARCHIVES = {"OTF": ("otf",), "TTF": ("ttf",), "Web": ("woff", "woff2")}


def members(family: str, extensions: tuple[str, ...]) -> list[Path]:
    files = []
    for extension in extensions:
        found = sorted((FONTS / extension).glob(f"{family}-*.{extension}"))
        if not found:
            sys.exit(f"{family}: no .{extension} files in fonts/{extension}")
        files += found
    return files


def write(archive: Path, files: list[Path]) -> str:
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zip_file:
        for path in files:
            zip_file.write(path, path.name)
    return f"{archive.name}: {len(files)} files, {archive.stat().st_size} bytes"


def main() -> None:
    families = sorted(source.stem for source in (ROOT / "sources").glob("*.glyphspackage"))
    jobs = [
        (RELEASE / f"{family}-{kind}.zip", members(family, extensions))
        for family in families
        for kind, extensions in ARCHIVES.items()
    ]
    if RELEASE.exists():
        shutil.rmtree(RELEASE)
    RELEASE.mkdir()
    with ProcessPoolExecutor() as pool:
        for line in pool.map(write, *zip(*jobs)):
            print(line)


if __name__ == "__main__":
    main()
