# Issue #5: Cyrillic ъ continuation-rounding fix

- [x] 1. Read issue #5; defect = protruding element rounded as separate shape, not stroke continuation
- [x] 2. Explore repo: 5 glyphspackages, 3 masters (Thin/Regular/Heavy), 9 instances with "RoundCorner; 45..165; 1" export filters; export = scripts/export-otf.sh + export-ttf.sh (AppleScript driving Glyphs 3), then scripts/update-fonts.sh
- [x] 3. Root cause: multi-shape glyph layers (sharp rect/path + component or second path) each rounded SEPARATELY at export before overlap merge; flush/abutting junctions expose rounded corners as creases
- [x] 4. Analytical fan-out over 754 candidate glyphs (459 classified: 64 affected, 54 suspicious, 341 safe; 12 batches failed on session limit / output cap; ~295 glyphs pending rerun after quota reset 2:50pm Asia/Seoul)
- [x] 5. Wrote rasterizing tooling (uv/PEP723): render-contact-sheet.py (+batch, +ppem) and pixel-compare.py (all-char before/after pixel-exact diff)
- [x] 6. Rendered 466 full-repertoire Black sheets + 23 flagged-char sheets + 10 zoom sheets; user-approved vision sweep queued for after quota reset
- [x] 7. Verification complete. Instruments: (a) my zoom review of 115 flagged chars, (b) throwaway merged-everything export + control export (control == shipped bit-exact, so pipeline is reproducible), (c) severity pixel metric, (d) adjudication sheets Current|Merged|SFPro for all 67 confirmed chars.
  - CONFIRMED AFFECTED, plain Remove Overlap fix adjudicated OK (merged == SF-style continuation): ъЪ љЉ ђЂ Ққ Щщ Џ м ѥ ѿ Ҁҁ Œ 4 ⁋ Ɓ ƃ Ɗ ƌ ƙ ɠ ɦ ɧ ɭ ɰ ɱ ɲ ɳ ʐ ʠ ȡ ȿ ɋ ȵ Ɛ Ϝ ϝ ε ϟ ɜ ɞ ʚ ₲ ⬒ 『 』 〖 〚 ̪ + PUA EE05 E05D E05E
  - CONFIRMED AFFECTED but Remove Overlap DESTROYS glyph (winding conflict; needs Correct Path Direction first, then merge, then re-adjudicate): Ҽ04BC ҽ04BD Ѭ046C æ00E6 ¶00B6 ɕ0255 Ɍ024C ɤ0264 ₠20A0 ₧20A7 ‽203D E054
  - FALSE POSITIVES (junction renders clean; merging would ALTER intended stroke design; DO NOT fix): D @ ^ ¬ њ Ч Э Я Є н э e R & ¥ Ф я and the rest of the 435-char severity superset
  - Key insight: font is stroke-constructed everywhere; per-shape rounding is the house style; only flush-continuation/abutment junctions are defects
- [ ] 7b. Vision sweep workflow (20 agents, running) as final net; fold any new visible-crease chars into fix set
- [x] 8. REPORTED affected characters to user (67 chars + variants) before fixing; tortoiseshell brackets 3014/3015/3018/3019 adjudicated and added after hook catch (fix set now 86 glyph names incl. mirrors and .full variants)
- [x] 9. Fix approach FINAL (validated on throwaways, real sources still untouched): source-level Remove Overlap REJECTED (8 glyphs become master-incompatible, "no outlines" in heavy weights, even with CPD All Masters). WINNING approach: per-instance custom parameter Filter "RemoveOverlap; include: <86 names>" inserted BEFORE the RoundCorner filter in each of the 9 instances; merge happens post-interpolation, zero source-geometry changes, no compatibility risk
- [x] 10. Recipe verified on throwaway5: export clean (no warnings); pixel-compare vs shipped = EXIT 0, all 9 weights, ONLY the 73 encoded affected chars differ, everything else bit-identical; final adjudication sheets (Before|Fixed|SFPro) confirm all fixes incl. the 12 formerly winding-broken glyphs
- [x] 11. Vision sweep (20 agents, 466 sheets, all 2793 chars) completed: no affected chars beyond the identified set
- [x] 12. Applied 45 filter insertions (9 instances x 5 packages) to real fontinfo.plists via Edit tool; all packages verified: 9 RemoveOverlap entries each, variable settings untouched (handbook-sourced decision), all 86 include-list names exist in every package; tortoiseshell family added after adjudication (3014/3015/3018/3019 + .full)
- [x] 13. Round-1 export completed via repo pipeline; verification caught a CFF/TTF inconsistency: TTF composites inherit merged bases via component refs, CFF decomposes composites into own-named copies that the include list missed. Resolution: component-reference closure computed per package (aeacute/aemacron/aiecyrillic, epsilon composites incl. polytonic Greek, epsilon1(=U+025B), uni04CE, Chedescenderabkhasiancyrillic pair incl. previously-missed visible Ҿҿ 04BE/04BF, four figure variants, guarani.full, invertedinterrobang, .hang brackets; _part orphans skipped) and appended to all 45 include lists via 5 replace-all edits. Round-2 full pipeline running (Temp cleaned, docs reloaded from disk first)
- [x] 13b. Round-2 verified; outline inspection then exposed that the RemoveOverlap FILTER cannot merge zero-overlap abutments: ъ љ ɭ stayed detached in several masters/families. Round-3 fix: extended the abutting arm/bar/hook 40 units into its neighbor in all masters of all 5 packages (38 node edits), full pipeline re-run
- [x] 14. Final verify green: OTF pixel-compare exit 0 (45/45), TTF exit 0 (45/45, after healing a truncated Disambiguated-Black.ttf that a mid-write Temp sync produced; size audit + stable-size gate added to memory), abutment scan 0/90 binaries, visual proof ъ љ ɭ continuous in shipped OTF+TTF matching SF Pro
- [x] 15. HTML report at issue5-report/report.html (untracked): live-text table of all affected chars x (Before | Fixed | SF Pro Rounded) in 3 weights + verification statement
- [x] 16. Committed (583007bd4) and pushed

# Release 1.1.0 (owner order 2026-07-23)

- [x] R1. Re-fan-out done: explore agent re-mapped repo/pipeline/filters; adversarial agent confirmed the staged fix (45 RemoveOverlap insertions before RoundCorner, variable settings untouched, binaries changed in scope) and corrected the abutment wording (32-42 units, only masters lacking overlap)
- [x] R2. scripts/regression-test.py added and run twice (64 and 256 ppem, exit 0 both)
- [x] R3. Suite verdict: exactly 47 encoded chars changed, 0 added, 0 removed, identical sets at both sizes; 44 merge-listed chars are geometric no-ops (crossing junctions), spot-checked clean at 320 ppem
- [x] R4. Vision verification done: 4 agents, 47 chars x 3 weights, 141 PASS / 0 FAIL / 0 UNCLEAR; hard-sign and lje defect removal explicitly observed
- [x] R5. Fix commit 583007bd4, suite commit 264335090; all 15 archives rebuilt fresh from the committed tree into an empty directory, counts/layout verified, committed as b5dbcdd4d
- [x] R6. Annotated tag v1.1.0 created and pushed with main
- [x] R7. Release live at https://github.com/anaclumos/sunghyun-sans/releases/tag/v1.1.0 with 15 assets, "## Changes" bullets, affected-characters details dropdown (47 changed, 0 added, 0 removed), Full Changelog link
- [x] R8. Cleanup done: both wip refs deleted, pending-commit note removed, TODO closed out
