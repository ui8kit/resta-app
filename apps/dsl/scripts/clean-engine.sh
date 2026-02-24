#!/usr/bin/env bash
#
# Clean generated apps/react output before re-generation.
# Use this before `bun run generate` to start fresh.
#
# Run from repo root:
#   bash scripts/clean-engine.sh
#

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

deleted=0

remove_path() {
  local path="$1"
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "removed: ${path#"$ROOT"/}"
    deleted=$((deleted + 1))
  fi
}

echo ""
echo "  Standalone App — Clean Generated Output"
echo "  ────────────────────────────────────────"
echo ""

remove_path "$ROOT/../react"
remove_path "$ROOT/node_modules/.vite"

shopt -s globstar nullglob
for f in "$ROOT"/**/*.tsbuildinfo; do
  [ -f "$f" ] || continue
  rm -f "$f"
  echo "removed: ${f#"$ROOT"/}"
  deleted=$((deleted + 1))
done
shopt -u globstar nullglob

echo ""
echo "Done. Removed $deleted item(s)."
echo "Next: bun run generate"
echo ""
