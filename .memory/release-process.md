---
name: release-process
description: How to ship a Sunghyun Sans release, including the mandatory rasterized regression suite and release-notes format
metadata:
  type: project
---

Owner's Claim (2026-07-23): every font release must ship with a rasterized regression test suite run, and the release page must list all affected character changes in a details dropdown. The changed characters must also be fanned out to agents for manual visual verification before publishing.

**Why:** binary font diffs are unreadable; the only trustworthy release gate is rendering every character of every binary and diffing pixels against the previous release, then having independent eyes confirm each change is intended.

**How to apply:**
- Release sequence (tag-only versioning, no manifest bumps: site/package.json historically stays put; font internal version lives in the binaries): commit the change, rebuild the 15 `release/` archives, commit those, annotated tag `vX.Y.Z`, push, `gh release create` with all 15 assets.
- `release/` archive layout (flat, no directories): `{Family}-OTF.zip` = 9 OTFs, `{Family}-TTF.zip` = 9 TTFs (Disambiguated and JP use `.7z` instead of zip for TTF), `{Family}-Web.zip` = 9 woff + 9 woff2. Five families: SunghyunSans, SunghyunSansDisambiguated, SunghyunSansJP, SunghyunSansKR, SunghyunSansKRHanja.
- Regression suite: `scripts/regression-test.py` (uv PEP723) renders every cmap character of every OTF and TTF at 64 ppem with FreeType, compares bitmaps + advances against the previous release's binaries (`git show <prev-tag>:fonts/...`), and prints the changed-character list per family/weight/format. Run it before tagging; its output is the source for the release notes dropdown.
- Release body format: `## Changes` bullets, then a `<details><summary>Affected characters</summary>` block listing every changed character (codepoint, glyph, what changed), then `**Full Changelog**: https://github.com/anaclumos/sunghyun-sans/compare/<prev>...<new>`.
- Agent verification: fan out vision agents over rendered before/after sheets of the changed characters; each change must be adjudicated as intended before the release is published. Related: [[rounding-pipeline]].
