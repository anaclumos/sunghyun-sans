#!/bin/sh
printf 'pre-push checks on %s in %s\n' "$(hostname -s)" "$(git rev-parse --show-toplevel)"
