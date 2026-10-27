#!/bin/sh
unset $(git rev-parse --local-env-vars)
if ! git diff --quiet HEAD -- scripts tests LICENSE fonts/otf; then
  echo 'scripts/, tests/, LICENSE, or fonts/otf differ from the pushed commit; commit or stash those changes first'
  exit 1
fi
exec env PYTHONDONTWRITEBYTECODE=1 uv run -q python -m unittest tests/test_*.py
