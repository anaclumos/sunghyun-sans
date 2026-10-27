#!/bin/sh
if ! git diff --quiet HEAD -- fonts dist LICENSE scripts/check-font-metadata.py; then
  echo 'fonts/, dist/, LICENSE, or the metadata check differ from the pushed commit; commit or restore them first'
  exit 1
fi
exec uv run -q scripts/check-font-metadata.py
