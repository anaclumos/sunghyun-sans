#!/bin/sh
if ! git diff --quiet HEAD -- scripts tests pyproject.toml uv.lock; then
  echo 'scripts/, tests/, pyproject.toml, or uv.lock differ from the pushed commit; commit or stash those changes first'
  exit 1
fi
uv lock --check || exit 1
exec uvx ruff@0.17.3 check scripts tests
