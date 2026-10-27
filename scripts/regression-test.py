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

The run exits 1 when a baseline binary is missing from the tree, when a tree
binary is absent at the baseline and not named with --new, or when a
character is changed, added, or removed without being on the expected-change
list. The list holds codepoints (U+044A) or glyph names as the binaries name
them (uni044A, A), given with --expect or in --expect-file files, separated
by whitespace or commas; in a file, # starts a comment. With no list, the run
passes only when nothing changed.

Usage:
  uv run scripts/regression-test.py
  uv run scripts/regression-test.py --baseline v1.0.2 --markdown notes.md
  uv run scripts/regression-test.py --expect U+044A uni0459 --expect-file expected.txt
  uv run scripts/regression-test.py --new fonts/otf/NewFamily-Regular.otf
"""

from __future__ import annotations

import argparse
import io
import re
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
FONT_SUFFIXES = (".otf", ".ttf")
CODEPOINT = re.compile(r"U\+([0-9A-F]{4,6})", re.IGNORECASE)


def list_binaries(root: Path) -> set[str]:
    return {
        f"{font_dir}/{path.name}"
        for font_dir in FONT_DIRS
        for path in (root / font_dir).glob("*")
        if path.suffix in FONT_SUFFIXES
    }


def read_expected(entries: list[str], files: list[str]) -> tuple[set[int], set[str]]:
    lines = [
        *entries,
        *(line.split("#", 1)[0] for file in files for line in Path(file).read_text(encoding="utf-8").splitlines()),
    ]
    codepoints: set[int] = set()
    names: set[str] = set()
    for token in re.findall(r"[^\s,]+", "\n".join(lines)):
        if match := CODEPOINT.fullmatch(token):
            codepoints.add(int(match[1], 16))
        else:
            names.add(token)
    return codepoints, names


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


def compare_pair(
    job: tuple[str, str, str, int, frozenset[str]],
) -> tuple[str, int, list[int], list[int], list[int], set[tuple[int, str]]]:
    rel, baseline_path, current_path, ppem, expected_names = job
    cmap_baseline = TTFont(baseline_path, lazy=True).getBestCmap()
    cmap_current = TTFont(current_path, lazy=True).getBestCmap()
    named = {
        (cp, name)
        for cmap in (cmap_baseline, cmap_current)
        for cp, name in cmap.items()
        if name in expected_names
    }
    added = sorted(cmap_current.keys() - cmap_baseline.keys())
    removed = sorted(cmap_baseline.keys() - cmap_current.keys())

    face_b = freetype.Face(baseline_path)
    face_c = freetype.Face(current_path)
    face_b.set_pixel_sizes(0, ppem)
    face_c.set_pixel_sizes(0, ppem)

    diffs: list[int] = []
    common = sorted(cmap_baseline.keys() & cmap_current.keys())
    for cp in common:
        if render_signature(face_b, cp) != render_signature(face_c, cp):
            diffs.append(cp)
    return (rel, len(common), diffs, added, removed, named)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--baseline", default="", help="git ref holding the previous release's fonts/ (default: latest v* tag)")
    ap.add_argument("--ppem", type=int, default=64)
    ap.add_argument("--markdown", default="", help="write a release-notes <details> block to this path")
    ap.add_argument("--expect", action="extend", nargs="+", default=[], metavar="ENTRY", help="codepoint (U+044A) or glyph name expected to change")
    ap.add_argument("--expect-file", action="append", default=[], metavar="PATH", help="file of expected-change entries")
    ap.add_argument("--new", action="extend", nargs="+", default=[], metavar="BINARY", help="tree binary absent at the baseline on purpose, as fonts/otf/Name.otf")
    args = ap.parse_args()

    try:
        expected_codepoints, expected_names = read_expected(args.expect, args.expect_file)
    except OSError as err:
        ap.error(f"--expect-file: {err}")

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

        baseline_binaries = list_binaries(Path(tmp))
        tree_binaries = list_binaries(ROOT)
        missing = sorted(baseline_binaries - tree_binaries)
        new = sorted(tree_binaries - baseline_binaries)
        jobs = [
            (rel, str(Path(tmp) / rel), str(ROOT / rel), args.ppem, frozenset(expected_names))
            for rel in sorted(baseline_binaries & tree_binaries)
        ]

        print(f"baseline={baseline} ppem={args.ppem} binaries={len(jobs)}")
        if missing:
            print(f"MISSING IN CURRENT TREE: {missing}")
        if new:
            print(f"NEW IN CURRENT TREE: {new}")
        if stray := sorted(set(args.new) - set(new)):
            ap.error(f"--new names no tree binary absent at {baseline}: {', '.join(stray)}")
        unannounced = [rel for rel in new if rel not in args.new]

        per_binary: list[tuple[str, int, list[int], list[int], list[int], set[tuple[int, str]]]] = []
        with ProcessPoolExecutor() as pool:
            for result in pool.map(compare_pair, jobs):
                per_binary.append(result)
                rel, total, diffs, added, removed, _named = result
                extras = f" added={len(added)} removed={len(removed)}" if added or removed else ""
                print(f"{rel}: {total} chars compared, {len(diffs)} changed{extras}")

    changed_in: dict[int, set[str]] = {}
    added_in: dict[int, set[str]] = {}
    removed_in: dict[int, set[str]] = {}
    named: set[tuple[int, str]] = set()
    for rel, _total, diffs, added, removed, binary_named in per_binary:
        for cp in diffs:
            changed_in.setdefault(cp, set()).add(rel)
        for cp in added:
            added_in.setdefault(cp, set()).add(rel)
        for cp in removed:
            removed_in.setdefault(cp, set()).add(rel)
        named |= binary_named
    expected = expected_codepoints | {cp for cp, _name in named}

    print(f"\nchanged codepoints: {len(changed_in)}  added: {len(added_in)}  removed: {len(removed_in)}")
    rows: list[tuple[str, int, set[str]]] = [
        *(("changed", cp, rels) for cp, rels in changed_in.items()),
        *(("added", cp, rels) for cp, rels in added_in.items()),
        *(("removed", cp, rels) for cp, rels in removed_in.items()),
    ]
    for kind, cp, rels in sorted(rows, key=lambda r: (r[0], r[1])):
        name = unicodedata.name(chr(cp), "(unnamed)")
        families = sorted({Path(rel).stem.split("-")[0] for rel in rels})
        mark = "" if cp in expected else " UNEXPECTED"
        print(f"  {kind} U+{cp:04X} {chr(cp)} {name}: {len(rels)} binaries ({', '.join(families)}){mark}")
    unexpected = {cp for _kind, cp, _rels in rows} - expected
    if unresolved := sorted(expected_names - {name for _cp, name in named}):
        print(f"\nexpected glyph names in no compared cmap: {unresolved}")

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

    failures: list[str] = []
    if missing:
        failures.append(f"{len(missing)} baseline binaries missing from the tree: {missing}")
    if unannounced:
        failures.append(f"{len(unannounced)} tree binaries absent at {baseline} and not named with --new: {unannounced}")
    if unexpected:
        failures.append(f"{len(unexpected)} characters changed, added, or removed outside the expected list (marked UNEXPECTED)")
    print()
    for failure in failures:
        print(f"FAIL: {failure}")
    if failures:
        sys.exit(1)
    print("PASS: no binary missing or unannounced, and no change outside the expected list")


if __name__ == "__main__":
    main()
