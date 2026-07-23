# /// script
# requires-python = ">=3.11"
# dependencies = ["freetype-py", "fonttools"]
# ///
"""Rasterized release regression suite.

Renders every cmap codepoint of every OTF and TTF in fonts/ at --ppem with
FreeType grayscale AA and compares bitmaps and metrics (size, bearings,
advance) against the same binaries at a baseline git ref. Reports exactly
which characters changed, per binary and aggregated per codepoint, so a
release can list every affected character.

Run before tagging a release. The default baseline is the latest v* tag;
pass --baseline explicitly when the previous release's binaries live at a
different ref. --markdown writes a <details> block ready for release notes.

Usage:
  uv run scripts/regression-test.py
  uv run scripts/regression-test.py --baseline v1.0.2 --markdown notes.md
"""

from __future__ import annotations

import argparse
import io
import subprocess
import sys
import tarfile
import tempfile
import unicodedata
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import freetype
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIRS = ("fonts/otf", "fonts/ttf")


def render_signature(face: freetype.Face, cp: int) -> tuple:
    face.load_char(chr(cp), freetype.FT_LOAD_RENDER)
    g = face.glyph
    return (
        g.bitmap.width,
        g.bitmap.rows,
        g.bitmap_left,
        g.bitmap_top,
        g.advance.x,
        bytes(g.bitmap.buffer),
    )


def compare_pair(job: tuple[str, str, str, int]) -> tuple[str, int, list[int], list[int], list[int]]:
    rel, baseline_path, current_path, ppem = job
    cmap_baseline = set(TTFont(baseline_path, lazy=True).getBestCmap())
    cmap_current = set(TTFont(current_path, lazy=True).getBestCmap())
    added = sorted(cmap_current - cmap_baseline)
    removed = sorted(cmap_baseline - cmap_current)

    face_b = freetype.Face(baseline_path)
    face_c = freetype.Face(current_path)
    face_b.set_pixel_sizes(0, ppem)
    face_c.set_pixel_sizes(0, ppem)

    diffs: list[int] = []
    common = sorted(cmap_baseline & cmap_current)
    for cp in common:
        if render_signature(face_b, cp) != render_signature(face_c, cp):
            diffs.append(cp)
    return (rel, len(common), diffs, added, removed)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--baseline", default="", help="git ref holding the previous release's fonts/ (default: latest v* tag)")
    ap.add_argument("--ppem", type=int, default=64)
    ap.add_argument("--markdown", default="", help="write a release-notes <details> block to this path")
    args = ap.parse_args()

    baseline = args.baseline or subprocess.run(
        ["git", "-C", str(ROOT), "describe", "--tags", "--abbrev=0", "--match", "v*"],
        check=True, capture_output=True, text=True,
    ).stdout.strip()

    with tempfile.TemporaryDirectory() as tmp:
        archive = subprocess.run(
            ["git", "-C", str(ROOT), "archive", baseline, *FONT_DIRS],
            check=True, capture_output=True,
        )
        with tarfile.open(fileobj=io.BytesIO(archive.stdout)) as tar:
            tar.extractall(tmp, filter="data")

        jobs: list[tuple[str, str, str, int]] = []
        missing: list[str] = []
        for font_dir in FONT_DIRS:
            for baseline_file in sorted((Path(tmp) / font_dir).iterdir()):
                rel = f"{font_dir}/{baseline_file.name}"
                current_file = ROOT / rel
                if current_file.exists():
                    jobs.append((rel, str(baseline_file), str(current_file), args.ppem))
                else:
                    missing.append(rel)

        print(f"baseline={baseline} ppem={args.ppem} binaries={len(jobs)}")
        if missing:
            print(f"MISSING IN CURRENT TREE: {missing}")

        per_binary: list[tuple[str, int, list[int], list[int], list[int]]] = []
        with ProcessPoolExecutor() as pool:
            for result in pool.map(compare_pair, jobs):
                per_binary.append(result)
                rel, total, diffs, added, removed = result
                extras = f" added={len(added)} removed={len(removed)}" if added or removed else ""
                print(f"{rel}: {total} chars compared, {len(diffs)} changed{extras}")

    changed_in: dict[int, set[str]] = {}
    added_in: dict[int, set[str]] = {}
    removed_in: dict[int, set[str]] = {}
    for rel, _total, diffs, added, removed in per_binary:
        for cp in diffs:
            changed_in.setdefault(cp, set()).add(rel)
        for cp in added:
            added_in.setdefault(cp, set()).add(rel)
        for cp in removed:
            removed_in.setdefault(cp, set()).add(rel)

    print(f"\nchanged codepoints: {len(changed_in)}  added: {len(added_in)}  removed: {len(removed_in)}")
    rows: list[tuple[str, int, set[str]]] = [
        *(("changed", cp, rels) for cp, rels in changed_in.items()),
        *(("added", cp, rels) for cp, rels in added_in.items()),
        *(("removed", cp, rels) for cp, rels in removed_in.items()),
    ]
    for kind, cp, rels in sorted(rows, key=lambda r: (r[0], r[1])):
        name = unicodedata.name(chr(cp), "(unnamed)")
        families = sorted({Path(rel).stem.split("-")[0] for rel in rels})
        print(f"  {kind} U+{cp:04X} {chr(cp)} {name}: {len(rels)} binaries ({', '.join(families)})")

    if args.markdown:
        lines = [
            "<details>",
            f"<summary>Affected characters ({len(changed_in)} changed"
            + (f", {len(added_in)} added" if added_in else "")
            + (f", {len(removed_in)} removed" if removed_in else "")
            + f" of {max((t for _r, t, *_ in per_binary), default=0)} compared per binary)</summary>",
            "",
            "| Character | Codepoint | Name | Change | Binaries |",
            "|---|---|---|---|---|",
        ]
        for kind, cp, rels in sorted(rows, key=lambda r: (r[0] != "changed", r[1])):
            name = unicodedata.name(chr(cp), "(unnamed)").title()
            families = sorted({Path(rel).stem.split("-")[0] for rel in rels})
            display = chr(cp).replace("|", "\\|")
            lines.append(f"| {display} | U+{cp:04X} | {name} | {kind} | {len(rels)} ({', '.join(families)}) |")
        lines += ["", "</details>", ""]
        Path(args.markdown).write_text("\n".join(lines), encoding="utf-8")
        print(f"\nmarkdown written to {args.markdown}")

    sys.exit(0)


if __name__ == "__main__":
    main()
