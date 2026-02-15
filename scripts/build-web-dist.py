#!/usr/bin/env python3
"""Build web distribution: CSS + woff2 subsets for CDN delivery.

Reads source fonts from fonts/woff2/, generates:
  - dist/web/css/          16 CSS files (full + dynamic-subset, normal + minified)
  - dist/web/woff2/        36 full font files (copy)
  - dist/web/woff2-dynamic-subset/  ~3000+ subset chunks
"""

from __future__ import annotations

import os
import re
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from fontTools import subset as ft_subset
from fontTools.ttLib import TTFont

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / "fonts" / "woff2"
DIST_DIR = ROOT / "dist" / "web"
CSS_DIR = DIST_DIR / "css"
WOFF2_DIR = DIST_DIR / "woff2"
SUBSET_DIR = DIST_DIR / "woff2-dynamic-subset"

WEIGHTS: list[tuple[str, int]] = [
    ("Thin", 100),
    ("ExtraLight", 200),
    ("Light", 300),
    ("Regular", 400),
    ("Medium", 500),
    ("SemiBold", 600),
    ("Bold", 700),
    ("ExtraBold", 800),
    ("Black", 900),
]

FAMILIES: dict[str, dict] = {
    "sunghyun-sans": {
        "font_family": "Sunghyun Sans",
        "file_prefix": "SunghyunSans",
        "is_cjk": False,
        "unicode_range": None,
    },
    "sunghyun-sans-kr": {
        "font_family": "Sunghyun Sans KR",
        "file_prefix": "SunghyunSansKR",
        "is_cjk": True,
        "unicode_range": "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF",
    },
    "sunghyun-sans-jp": {
        "font_family": "Sunghyun Sans JP",
        "file_prefix": "SunghyunSansJP",
        "is_cjk": True,
        "unicode_range": (
            "U+3000-303F, U+3040-309F, U+30A0-30FF, U+31F0-31FF, "
            "U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF, U+FF00-FFEF"
        ),
    },
    "sunghyun-sans-disambiguated": {
        "font_family": "Sunghyun Sans Disambiguated",
        "file_prefix": "SunghyunSansDisambiguated",
        "is_cjk": True,
        "unicode_range": (
            "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF, "
            "U+3000-303F, U+3040-309F, U+30A0-30FF, U+31F0-31FF, "
            "U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF, U+FF00-FFEF"
        ),
    },
}

SLICE_SIZE = 150  # codepoints per dynamic-subset slice
MAX_WORKERS = 8

# ---------------------------------------------------------------------------
# Unicode-range helpers
# ---------------------------------------------------------------------------


def codepoints_to_unicode_range(codepoints: list[int]) -> str:
    """Convert sorted list of codepoints to a unicode-range string."""
    if not codepoints:
        return ""
    cps = sorted(codepoints)
    ranges: list[str] = []
    start = cps[0]
    end = cps[0]
    for cp in cps[1:]:
        if cp == end + 1:
            end = cp
        else:
            if start == end:
                ranges.append(f"U+{start:04X}")
            else:
                ranges.append(f"U+{start:04X}-{end:04X}")
            start = cp
            end = cp
    if start == end:
        ranges.append(f"U+{start:04X}")
    else:
        ranges.append(f"U+{start:04X}-{end:04X}")
    return ", ".join(ranges)


def get_font_codepoints(font_path: str | Path) -> list[int]:
    """Extract all codepoints from a font's cmap table."""
    font = TTFont(str(font_path))
    cmap = font.getBestCmap()
    font.close()
    return sorted(cmap.keys()) if cmap else []


def make_slices(codepoints: list[int], slice_size: int) -> list[list[int]]:
    """Split sorted codepoints into slices of approximately slice_size."""
    cps = sorted(codepoints)
    slices: list[list[int]] = []
    for i in range(0, len(cps), slice_size):
        chunk = cps[i : i + slice_size]
        if chunk:
            slices.append(chunk)
    return slices


# ---------------------------------------------------------------------------
# Font subsetting (runs in worker process)
# ---------------------------------------------------------------------------


def subset_font_worker(args: tuple) -> tuple[str, bool]:
    """Worker function for ProcessPoolExecutor.

    Args: (source_path, output_path, codepoints_list)
    Returns: (output_path, success)
    """
    source_path, output_path, codepoints = args
    try:
        font = TTFont(source_path)
        options = ft_subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.desubroutinize = True
        options.notdef_outline = True

        subsetter = ft_subset.Subsetter(options=options)
        subsetter.populate(unicodes=codepoints)
        subsetter.subset(font)

        # Check if any real glyphs remain (besides .notdef)
        glyphs = font.getGlyphOrder()
        if len(glyphs) <= 1:
            font.close()
            return (output_path, False)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        font.save(output_path)
        font.close()
        return (output_path, True)
    except Exception as e:
        print(f"  ERROR subsetting {output_path}: {e}", file=sys.stderr)
        return (output_path, False)


# ---------------------------------------------------------------------------
# CSS generation
# ---------------------------------------------------------------------------


def generate_full_css(slug: str, family_info: dict) -> str:
    """Generate full @font-face CSS for a family (one rule per weight)."""
    lines: list[str] = []
    font_family = family_info["font_family"]
    file_prefix = family_info["file_prefix"]
    unicode_range = family_info["unicode_range"]

    for weight_name, weight_value in WEIGHTS:
        filename = f"{file_prefix}-{weight_name}.woff2"
        lines.append("@font-face {")
        lines.append(f"  font-family: '{font_family}';")
        lines.append("  font-style: normal;")
        lines.append(f"  font-weight: {weight_value};")
        lines.append("  font-display: swap;")
        lines.append(f"  src: url('../woff2/{filename}') format('woff2');")
        if unicode_range:
            lines.append(f"  unicode-range: {unicode_range};")
        lines.append("}")
        lines.append("")

    return "\n".join(lines)


def generate_dynamic_subset_css_latin(slug: str, family_info: dict) -> str:
    """For Sans (Latin-only): dynamic-subset just references the full files."""
    lines: list[str] = []
    font_family = family_info["font_family"]
    file_prefix = family_info["file_prefix"]

    # Get codepoints from the Regular weight to create slices
    regular_path = FONTS_DIR / f"{file_prefix}-Regular.woff2"
    codepoints = get_font_codepoints(regular_path)
    slices = make_slices(codepoints, SLICE_SIZE)

    for weight_name, weight_value in WEIGHTS:
        for idx, slice_cps in enumerate(slices):
            ur = codepoints_to_unicode_range(slice_cps)
            filename = f"{file_prefix}-{weight_name}.subset.{idx}.woff2"
            lines.append("@font-face {")
            lines.append(f"  font-family: '{font_family}';")
            lines.append("  font-style: normal;")
            lines.append(f"  font-weight: {weight_value};")
            lines.append("  font-display: swap;")
            lines.append(
                f"  src: url('../woff2-dynamic-subset/{filename}') format('woff2');"
            )
            lines.append(f"  unicode-range: {ur};")
            lines.append("}")
            lines.append("")

    return "\n".join(lines)


def generate_dynamic_subset_css_cjk(
    slug: str,
    family_info: dict,
    slice_map: dict[str, list[tuple[int, str]]],
) -> str:
    """For CJK families: dynamic-subset references subset chunk files.

    slice_map: {weight_name: [(slice_idx, unicode_range_str), ...]}
    """
    lines: list[str] = []
    font_family = family_info["font_family"]
    file_prefix = family_info["file_prefix"]

    for weight_name, weight_value in WEIGHTS:
        if weight_name not in slice_map:
            continue
        for idx, ur in slice_map[weight_name]:
            filename = f"{file_prefix}-{weight_name}.subset.{idx}.woff2"
            lines.append("@font-face {")
            lines.append(f"  font-family: '{font_family}';")
            lines.append("  font-style: normal;")
            lines.append(f"  font-weight: {weight_value};")
            lines.append("  font-display: swap;")
            lines.append(
                f"  src: url('../woff2-dynamic-subset/{filename}') format('woff2');"
            )
            lines.append(f"  unicode-range: {ur};")
            lines.append("}")
            lines.append("")

    return "\n".join(lines)


def minify_css(css: str) -> str:
    """Simple CSS minification."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*\{\s*", "{", css)
    css = re.sub(r"\s*\}\s*", "}\n", css)
    css = re.sub(r"\s*:\s*", ":", css)
    css = re.sub(r"\s*;\s*", ";", css)
    css = re.sub(r";\s*\}", "}", css)
    return css.strip()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    start_time = time.time()
    print("=" * 60)
    print("Building web distribution")
    print("=" * 60)

    # ------------------------------------------------------------------
    # 1. Clean & create output directories
    # ------------------------------------------------------------------
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    WOFF2_DIR.mkdir(parents=True, exist_ok=True)
    SUBSET_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 2. Copy full woff2 files
    # ------------------------------------------------------------------
    print("\n[1/4] Copying full woff2 files...")
    copied = 0
    for woff2_file in sorted(FONTS_DIR.glob("*.woff2")):
        shutil.copy2(woff2_file, WOFF2_DIR / woff2_file.name)
        copied += 1
    print(f"  Copied {copied} files to dist/web/woff2/")

    # ------------------------------------------------------------------
    # 3. Generate dynamic subsets
    # ------------------------------------------------------------------
    print("\n[2/4] Generating dynamic subsets...")

    # Build all subset jobs
    all_jobs: list[tuple[str, str, list[int]]] = []  # (src, dst, codepoints)
    # Track slice info for CSS generation: {slug: {weight_name: [(idx, ur_str)]}}
    slice_registry: dict[str, dict[str, list[tuple[int, str]]]] = {}

    for slug, info in FAMILIES.items():
        file_prefix = info["file_prefix"]
        is_cjk = info["is_cjk"]

        # Get codepoints from Regular weight (same glyph set across weights)
        regular_path = FONTS_DIR / f"{file_prefix}-Regular.woff2"
        codepoints = get_font_codepoints(regular_path)
        slices = make_slices(codepoints, SLICE_SIZE)

        print(f"  {slug}: {len(codepoints)} codepoints -> {len(slices)} slices")
        slice_registry[slug] = {}

        for weight_name, _weight_value in WEIGHTS:
            src_path = str(FONTS_DIR / f"{file_prefix}-{weight_name}.woff2")
            weight_slices: list[tuple[int, str]] = []

            for idx, slice_cps in enumerate(slices):
                dst_path = str(
                    SUBSET_DIR / f"{file_prefix}-{weight_name}.subset.{idx}.woff2"
                )
                ur_str = codepoints_to_unicode_range(slice_cps)
                all_jobs.append((src_path, dst_path, slice_cps))
                weight_slices.append((idx, ur_str))

            slice_registry[slug][weight_name] = weight_slices

    print(f"\n  Total subset jobs: {len(all_jobs)}")
    print(f"  Running with {MAX_WORKERS} workers...")

    # Execute subset jobs in parallel
    completed = 0
    succeeded = 0
    skipped = 0

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(subset_font_worker, job): job[1] for job in all_jobs
        }
        for future in as_completed(futures):
            output_path, success = future.result()
            completed += 1
            if success:
                succeeded += 1
            else:
                skipped += 1
            if completed % 500 == 0 or completed == len(all_jobs):
                print(
                    f"  Progress: {completed}/{len(all_jobs)} "
                    f"(success={succeeded}, skipped={skipped})"
                )

    # Remove entries for skipped (empty) slices from registry
    for slug, info in FAMILIES.items():
        file_prefix = info["file_prefix"]
        for weight_name in slice_registry[slug]:
            filtered = []
            for idx, ur_str in slice_registry[slug][weight_name]:
                subset_path = (
                    SUBSET_DIR
                    / f"{file_prefix}-{weight_name}.subset.{idx}.woff2"
                )
                if subset_path.exists() and subset_path.stat().st_size > 0:
                    filtered.append((idx, ur_str))
            slice_registry[slug][weight_name] = filtered

    print(f"\n  Subsets created: {succeeded}")
    print(f"  Empty slices skipped: {skipped}")

    # ------------------------------------------------------------------
    # 4. Generate CSS files
    # ------------------------------------------------------------------
    print("\n[3/4] Generating CSS files...")
    css_count = 0

    for slug, info in FAMILIES.items():
        # --- Full CSS ---
        full_css = generate_full_css(slug, info)
        full_css_path = CSS_DIR / f"{slug}.css"
        full_css_path.write_text(full_css, encoding="utf-8")
        css_count += 1

        min_css_path = CSS_DIR / f"{slug}.min.css"
        min_css_path.write_text(minify_css(full_css), encoding="utf-8")
        css_count += 1

        # --- Dynamic subset CSS ---
        if info["is_cjk"]:
            ds_css = generate_dynamic_subset_css_cjk(slug, info, slice_registry[slug])
        else:
            ds_css = generate_dynamic_subset_css_latin(slug, info)

        ds_css_path = CSS_DIR / f"{slug}-dynamic-subset.css"
        ds_css_path.write_text(ds_css, encoding="utf-8")
        css_count += 1

        ds_min_path = CSS_DIR / f"{slug}-dynamic-subset.min.css"
        ds_min_path.write_text(minify_css(ds_css), encoding="utf-8")
        css_count += 1

        print(f"  {slug}: 4 CSS files")

    print(f"  Total CSS files: {css_count}")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    elapsed = time.time() - start_time
    woff2_count = len(list(WOFF2_DIR.glob("*.woff2")))
    subset_count = len(list(SUBSET_DIR.glob("*.woff2")))
    css_file_count = len(list(CSS_DIR.glob("*.css")))
    empty_check = [
        f
        for f in SUBSET_DIR.glob("*.woff2")
        if f.stat().st_size == 0
    ]

    print("\n" + "=" * 60)
    print("BUILD COMPLETE")
    print("=" * 60)
    print(f"  Time: {elapsed:.1f}s")
    print(f"  dist/web/woff2/:                {woff2_count} files")
    print(f"  dist/web/woff2-dynamic-subset/: {subset_count} files")
    print(f"  dist/web/css/:                  {css_file_count} files")
    print(f"  Empty woff2 files:              {len(empty_check)}")
    print()

    if woff2_count != 36:
        print(f"  WARNING: Expected 36 woff2 files, got {woff2_count}")
    if css_file_count != 16:
        print(f"  WARNING: Expected 16 CSS files, got {css_file_count}")
    if empty_check:
        print(f"  WARNING: {len(empty_check)} empty woff2 files found!")
    if subset_count < 2500:
        print(f"  WARNING: Expected >2500 subset files, got {subset_count}")


if __name__ == "__main__":
    main()
