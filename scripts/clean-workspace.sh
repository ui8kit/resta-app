#!/usr/bin/env bash
#
# Full cleanup for standalone app:
#   - node_modules
#   - dist
#   - *.tsbuildinfo
#
# Run from repo root:
#   bash scripts/clean-workspace.sh
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
echo "  Standalone App — Full Cleanup"
echo "  ──────────────────────────────"
echo ""

remove_path "$ROOT/node_modules"
remove_path "$ROOT/dist"

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
echo ""
