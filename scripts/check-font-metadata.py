# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.67.0"]
# ///

from __future__ import annotations

import re
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SUNGHYUN = "Copyright 2026 The Sunghyun Sans Project Authors (https://github.com/anaclumos/sunghyun-sans)."
PRETENDARD = "Copyright (c) 2021, Kil Hyung-jin (https://github.com/orioncactus/pretendard)."
ADOBE = "Copyright 2014-2021 Adobe (http://www.adobe.com/)."
INTER = "Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter)."
MPLUS = "Copyright 2021 The M+ FONTS Project Authors (https://github.com/coz-m/MPLUS_FONTS)."
LATIN = (SUNGHYUN, PRETENDARD, INTER)
CJK = (SUNGHYUN, PRETENDARD, ADOBE, INTER, MPLUS)
GOOGLE_FONTS = re.compile(r"copyright \d{4}(-\d{4})?(,\s*\d{4}(-\d{4})?)*,? (the .* project authors \([^@]*\)|google llc. all rights reserved)")
TRADEMARK = (
    "Pretendard is a trademark of Kil Hyung-jin; Inter UI and Inter is a trademark of rsms; "
    "Source is a trademark of Adobe in the United States and/or other countries."
)
LICENSE_LINES = (
    "Copyright (c) 2021, Kil Hyung-jin (https://github.com/orioncactus/pretendard),\nwith Reserved Font Name 'Pretendard'.",
    "Copyright 2014-2021 Adobe (http://www.adobe.com/),\nwith Reserved Font Name 'Source'.\n"
    "Source is a trademark of Adobe in the United States and/or other countries.",
    "Copyright (c) 2016 The Inter Project Authors (https://github.com/rsms/inter),\nwith Reserved Font Name 'Inter'.",
    "Copyright 2021 The M+ FONTS Project Authors (https://github.com/coz-m/MPLUS_FONTS),\n"
    "with Reserved Font Name 'M PLUS 1'.",
)


def problems(path: Path) -> list[str]:
    family = path.name.rsplit("-", 1)[0]
    required = LATIN if family == "SunghyunSans" else CJK
    font = TTFont(path, lazy=True)
    records = {nameID: [record.toUnicode() for record in font["name"].names if record.nameID == nameID] for nameID in (0, 7)}
    font.close()
    name = path.relative_to(ROOT)
    found = [f"{name}: no name ID {nameID} record" for nameID, values in records.items() if not values]
    for record in records[0]:
        found += [f"{name}: name ID 0 {record!r} lacks {statement!r}" for statement in required if statement not in record]
        if len(record) > 500 or "\n" in record or not GOOGLE_FONTS.search(record.lower()):
            found.append(f"{name}: name ID 0 {record!r} fails Google Fonts' copyright format (one line, at most 500 characters)")
    found += [f"{name}: name ID 7 {record!r} lacks {TRADEMARK!r}" for record in records[7] if TRADEMARK not in record]
    return found


def main() -> None:
    license_text = (ROOT / "LICENSE").read_text()
    found = [f"LICENSE: missing {line!r}" for line in LICENSE_LINES if line not in license_text]

    binaries = sorted(
        path
        for pattern in ("fonts/*/*.otf", "fonts/*/*.ttf", "fonts/*/*.woff", "fonts/*/*.woff2", "dist/web/woff2/*.woff2")
        for path in ROOT.glob(pattern)
    )
    if not binaries:
        found.append("no font binaries under fonts/ or dist/web/woff2/")
    with ProcessPoolExecutor() as pool:
        for result in pool.map(problems, binaries, chunksize=4):
            found += result

    if found:
        sys.exit("\n".join(found))
    print(f"{len(binaries)} binaries carry the upstream copyright and trademark notices, and LICENSE keeps its Reserved Font Names")


if __name__ == "__main__":
    main()
