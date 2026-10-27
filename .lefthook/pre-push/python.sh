#!/bin/sh
uv lock --check || exit 1
exec uvx ruff@0.17.3 check scripts
