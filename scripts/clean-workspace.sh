#!/usr/bin/env bash
#
# Full development cleanup across the workspace:
# - **/node_modules
# - **/dist
# - **/*.tsbuildinfo
# - **/bun.lock
# - **/.turbo
# - apps/**/.cursor/reports/*
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

remove_file() {
  local path="$1"
  if [ -f "$path" ]; then
    rm -f "$path"
    echo "removed: ${path#"$ROOT"/}"
    deleted=$((deleted + 1))
  fi
}

echo ""
echo "  UI8Kit Workspace Cleanup"
echo "  ────────────────────────"
echo ""

# 1) Folder cleanup (single pass, avoids deep traversal in matched dirs)
while IFS= read -r -d '' dir; do
  remove_path "$dir"
done < <(
  find "$ROOT" \
    -type d \
    \( -name node_modules -o -name dist -o -name .turbo \) \
    -prune \
    -print0
)

# 2) File cleanup (skip heavy folders while scanning)
while IFS= read -r -d '' file; do
  remove_file "$file"
done < <(
  find "$ROOT" \
    \( -type d \( -name .git -o -name node_modules -o -name dist -o -name .turbo \) -prune \) \
    -o \
    \( -type f \( -name "*.tsbuildinfo" -o -name "bun.lock" \) -print0 \)
)

# 3) App report files cleanup: apps/**/.cursor/reports/*
if [ -d "$ROOT/apps" ]; then
  while IFS= read -r -d '' report_file; do
    remove_file "$report_file"
  done < <(
    find "$ROOT/apps" \
      \( -type d \( -name node_modules -o -name dist -o -name .turbo \) -prune \) \
      -o \
      \( -type f -path "*/.cursor/reports/*" -print0 \)
  )
fi

echo ""
echo "Done. Removed $deleted item(s)."
echo ""
