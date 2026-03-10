#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"


sync_glyphs_temp_exports() {
	local temp_dir="$HOME/Library/Application Support/Glyphs 3/Temp"
	find "$temp_dir" -maxdepth 1 -type f \
		\( -name 'SunghyunSans-*' -o -name 'SunghyunSansDisambiguated-*' -o -name 'SunghyunSansJP-*' -o -name 'SunghyunSansKRHanja-*' -o -name 'SunghyunSansKR-*' \) \
		\( -name '*.otf' -o -name '*.ttf' -o -name '*.woff' -o -name '*.woff2' \) \
		! -name '*_unhinted.ttf' \
		-exec cp -f {} "$ROOT_DIR" \;
}

verify_exports() {
	local family
	local ext
	local count
	for family in SunghyunSans SunghyunSansDisambiguated SunghyunSansJP SunghyunSansKRHanja SunghyunSansKR; do
		for ext in otf ttf woff woff2; do
			count="$(find "$ROOT_DIR" -maxdepth 1 -name "$family-*.$ext" ! -name '*_unhinted.ttf' | wc -l | tr -d ' ')"
			if [ "$count" -ne 9 ]; then
				echo "Missing exports for $family ($ext=$count, expected 9)" >&2
				return 1
			fi
		done
	done
}

echo "=== Syncing completed exports from Glyphs temp ==="
sync_glyphs_temp_exports

echo "=== Verifying exported files ==="
verify_exports

echo "=== Moving font files to fonts/ ==="
mv *.otf fonts/otf/
mv *.ttf fonts/ttf/
mv *.woff fonts/woff/
mv *.woff2 fonts/woff2/

echo "=== Rebuilding web dist ==="
uv run scripts/build-web-dist.py

echo "=== Updating site copy ==="
rm -rf site/public/dist
cp -R dist/web site/public/dist

echo "=== Done ==="
