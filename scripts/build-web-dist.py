#!/usr/bin/env python3
"""Build web distribution: CSS + woff2 subsets for CDN delivery.

Reads source fonts from fonts/woff2/, generates:
  - dist/web/css/          per-family CSS files (full + dynamic-subset, normal + minified)
  - dist/web/woff2/        36 full font files (copy)
  - dist/web/woff2-dynamic-subset/  ~3000+ subset chunks
"""

from __future__ import annotations

import shutil
import time
from concurrent.futures import ProcessPoolExecutor
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
        "unicode_range": None,
    },
    "sunghyun-sans-kr": {
        "font_family": "Sunghyun Sans KR",
        "file_prefix": "SunghyunSansKR",
        "unicode_range": "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF",
    },
    "sunghyun-sans-kr-hanja": {
        "font_family": "Sunghyun Sans KR Hanja",
        "file_prefix": "SunghyunSansKRHanja",
        "unicode_range": (
            "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF, "
            "U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF"
        ),
    },
    "sunghyun-sans-jp": {
        "font_family": "Sunghyun Sans JP",
        "file_prefix": "SunghyunSansJP",
        "unicode_range": (
            "U+3000-303F, U+3040-309F, U+30A0-30FF, U+31F0-31FF, "
            "U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF, U+FF00-FFEF"
        ),
    },
    "sunghyun-sans-disambiguated": {
        "font_family": "Sunghyun Sans Disambiguated",
        "file_prefix": "SunghyunSansDisambiguated",
        "unicode_range": (
            "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF, "
            "U+3000-303F, U+3040-309F, U+30A0-30FF, U+31F0-31FF, "
            "U+4E00-9FFF, U+3400-4DBF, U+F900-FAFF, U+FF00-FFEF"
        ),
    },
}

SLICE_SIZE = 150  # codepoints per dynamic-subset slice

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


# ---------------------------------------------------------------------------
# Font subsetting (runs in worker process)
# ---------------------------------------------------------------------------


def subset_font_worker(
    source_path: Path, output_path: Path, codepoints: list[int]
) -> bool:
    with TTFont(source_path) as font:
        options = ft_subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.desubroutinize = True
        options.notdef_outline = True

        subsetter = ft_subset.Subsetter(options=options)
        subsetter.populate(unicodes=codepoints)
        subsetter.subset(font)

        # Check if any real glyphs remain (besides .notdef)
        if len(font.getGlyphOrder()) <= 1:
            return False

        font.save(output_path)
        return True


# ---------------------------------------------------------------------------
# CSS generation
# ---------------------------------------------------------------------------


def render_css(rules: list[tuple[str, int, str, str | None]], compact: bool) -> str:
    opening, colon, separator, closing = (
        ("{", ":", ";", "}") if compact else (" {\n  ", ": ", ";\n  ", ";\n}\n")
    )
    blocks: list[str] = []
    for font_family, weight, src, unicode_range in rules:
        declarations = [
            f"font-family{colon}'{font_family}'",
            f"font-style{colon}normal",
            f"font-weight{colon}{weight}",
            f"font-display{colon}swap",
            f"src{colon}url('{src}') format('woff2')",
        ]
        if unicode_range:
            declarations.append(f"unicode-range{colon}{unicode_range}")
        blocks.append(f"@font-face{opening}{separator.join(declarations)}{closing}")
    return "\n".join(blocks)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    start_time = time.time()

    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    WOFF2_DIR.mkdir(parents=True, exist_ok=True)
    SUBSET_DIR.mkdir(parents=True, exist_ok=True)

    with ProcessPoolExecutor() as executor:
        for slug, info in FAMILIES.items():
            font_family = info["font_family"]
            file_prefix = info["file_prefix"]

            # Get codepoints from Regular weight (same glyph set across weights)
            with TTFont(FONTS_DIR / f"{file_prefix}-Regular.woff2") as regular:
                codepoints = sorted(regular.getBestCmap())
            slices = [
                codepoints[i : i + SLICE_SIZE]
                for i in range(0, len(codepoints), SLICE_SIZE)
            ]

            full_rules: list[tuple[str, int, str, str | None]] = []
            subset_jobs: list[tuple[Path, Path, list[int]]] = []
            slice_rules: list[tuple[str, int, str, str | None]] = []
            for weight_name, weight_value in WEIGHTS:
                source = FONTS_DIR / f"{file_prefix}-{weight_name}.woff2"
                shutil.copy2(source, WOFF2_DIR)
                full_rules.append(
                    (
                        font_family,
                        weight_value,
                        f"../woff2/{source.name}",
                        info["unicode_range"],
                    )
                )
                for idx, slice_cps in enumerate(slices):
                    subset = SUBSET_DIR / f"{source.stem}.subset.{idx}.woff2"
                    subset_jobs.append((source, subset, slice_cps))
                    slice_rules.append(
                        (
                            font_family,
                            weight_value,
                            f"../woff2-dynamic-subset/{subset.name}",
                            codepoints_to_unicode_range(slice_cps),
                        )
                    )

            futures = [executor.submit(subset_font_worker, *job) for job in subset_jobs]
            subset_rules: list[tuple[str, int, str, str | None]] = []
            for (source, subset, _), future, rule in zip(
                subset_jobs, futures, slice_rules, strict=True
            ):
                if error := future.exception():
                    executor.shutdown(cancel_futures=True)
                    raise RuntimeError(
                        f"Cannot subset {source.name} into {subset.name}"
                    ) from error
                if future.result():
                    subset_rules.append(rule)

            for name, rules in (
                (slug, full_rules),
                (f"{slug}-dynamic-subset", subset_rules),
            ):
                css = render_css(rules, compact=False)
                (CSS_DIR / f"{name}.css").write_text(css, encoding="utf-8")
                min_css = render_css(rules, compact=True)
                (CSS_DIR / f"{name}.min.css").write_text(min_css, encoding="utf-8")

            print(
                f"  {slug}: {len(codepoints)} codepoints -> {len(slices)} slices, "
                f"{len(subset_rules)} subsets"
            )

    print(f"Built dist/web in {time.time() - start_time:.1f}s")


if __name__ == "__main__":
    main()
