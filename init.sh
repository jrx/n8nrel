#!/usr/bin/env bash
# Ralph environment smoke check for n8nrel.
# Idempotent: safe to run repeatedly. Brings the project to a runnable state
# and runs the available quality checks.
set -euo pipefail

cd "$(dirname "$0")"

echo "== n8nrel init =="

if [ ! -f package.json ]; then
  echo "No package.json found; nothing to set up."
  exit 0
fi

# Install dependencies. `npm ci` is idempotent and repairs a stale
# node_modules, so it is safe to run every time when a lockfile exists.
echo "-- installing dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# Capture the available npm scripts once (avoids broken-pipe noise).
scripts="$(npm run 2>/dev/null || true)"

# Typecheck (no emit) if the script exists.
if grep -qE '^\s*typecheck' <<<"$scripts"; then
  echo "-- typecheck"
  npm run typecheck
else
  echo "-- no typecheck script, skipping"
fi

# Build if the script exists.
if grep -qE '^\s*build' <<<"$scripts"; then
  echo "-- build"
  npm run build
else
  echo "-- no build script, skipping"
fi

# Run tests if a test script exists (and is not the npm default placeholder).
if grep -qE '^\s*test' <<<"$scripts" \
   && ! grep -q '"test": *"echo \\"Error: no test specified\\"' package.json; then
  echo "-- test"
  npm test
else
  echo "-- no test script, skipping"
fi

# Smoke check: the built CLI should run and print a version.
if [ -f dist/index.js ]; then
  echo "-- smoke: node dist/index.js"
  node dist/index.js || echo "   (CLI run failed or needs network; continuing)"
fi

echo "== init complete =="
