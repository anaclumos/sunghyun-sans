#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

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
