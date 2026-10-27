#!/bin/sh
tree=$(git ls-tree -r -l --full-tree HEAD) || exit 1
status=0
banned=$(printf '%s\n' "$tree" | cut -f2 | grep -i -E '(^|/)release/|\.(zip|7z)$|sf[-_ ]?pro')
if [ -n "$banned" ]; then
  printf 'Release archives belong on GitHub releases and Apple fonts nowhere in the tree:\n%s\n' "$banned"
  status=1
fi
large=$(printf '%s\n' "$tree" | awk '$4 > 52428800 { print $4, $5 }')
if [ -n "$large" ]; then
  printf 'Files over 50 MB:\n%s\n' "$large"
  status=1
fi
exit $status
