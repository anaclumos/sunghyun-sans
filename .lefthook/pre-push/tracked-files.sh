#!/bin/sh
status=0
banned=$(git ls-tree -r --name-only --full-tree HEAD | grep -i -E '(^|/)release/|\.(zip|7z)$|sf-pro')
if [ -n "$banned" ]; then
  printf 'Release archives belong on GitHub releases and Apple fonts nowhere in the tree:\n%s\n' "$banned"
  status=1
fi
large=$(git ls-tree -r -l --full-tree HEAD | awk '$4 > 52428800 { print $4, $5 }')
if [ -n "$large" ]; then
  printf 'Files over 50 MB:\n%s\n' "$large"
  status=1
fi
exit $status
