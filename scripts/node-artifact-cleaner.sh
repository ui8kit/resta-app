#!/usr/bin/env bash
#
# Recursive cleanup for common Node.js, Bun, and Turbo workspace artifacts.
#
# Removes:
# - **/node_modules
# - **/dist
# - **/.turbo
# - **/.next
# - **/.nuxt
# - **/.svelte-kit
# - **/.parcel-cache
# - **/coverage
# - **/.cache
# - **/*.tsbuildinfo
# - **/bun.lock
# - **/bun.lockb
# - **/package-lock.json
# - **/yarn.lock
# - **/pnpm-lock.yaml
#
# Run from the repository root:
#   bash scripts/node-artifact-cleaner.sh
#   bash scripts/node-artifact-cleaner.sh --dry-run
#   bash scripts/node-artifact-cleaner.sh --yes
#
# The script prints the detected root and asks for confirmation
# before removing any matched directories or files.
#

set -euo pipefail

DRY_RUN=0
AUTO_CONFIRM=0

print_usage() {
  echo "Usage: bash scripts/node-artifact-cleaner.sh [--dry-run] [--yes] [--help]"
  echo ""
  echo "Options:"
  echo "  --dry-run  Preview matching files and directories without deleting them."
  echo "  --yes      Skip the interactive confirmation prompt."
  echo "  -h, --help Show this help message and exit."
}

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --yes)
      AUTO_CONFIRM=1
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $arg"
      echo ""
      print_usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
SCRIPT_NAME="$(basename "$0")"

if [ "$(basename "$SCRIPT_DIR")" != "scripts" ] || [ "$SCRIPT_NAME" != "node-artifact-cleaner.sh" ]; then
  echo "Error: script must be located at scripts/node-artifact-cleaner.sh"
  echo "Refusing to run cleanup from an unexpected location."
  exit 1
fi

ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$ROOT"

deleted=0

CLEAN_DIR_NAME_MATCHERS=(
  -name node_modules
  -o -name dist
  -o -name .turbo
  -o -name .next
  -o -name .nuxt
  -o -name .svelte-kit
  -o -name .parcel-cache
  -o -name coverage
  -o -name .cache
)

CLEAN_FILE_NAME_MATCHERS=(
  -name "*.tsbuildinfo"
  -o -name "bun.lock"
  -o -name "bun.lockb"
  -o -name "package-lock.json"
  -o -name "yarn.lock"
  -o -name "pnpm-lock.yaml"
)

remove_path() {
  local path="$1"
  if [ -e "$path" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would remove: ${path#"$ROOT"/}"
    else
      rm -rf "$path"
      echo "removed: ${path#"$ROOT"/}"
    fi
    deleted=$((deleted + 1))
  fi
}

remove_file() {
  local path="$1"
  if [ -f "$path" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would remove: ${path#"$ROOT"/}"
    else
      rm -f "$path"
      echo "removed: ${path#"$ROOT"/}"
    fi
    deleted=$((deleted + 1))
  fi
}

echo ""
echo "  Node Artifact Cleanup"
echo "  ─────────────────────"
echo "  Root: $ROOT"
if [ "$DRY_RUN" -eq 1 ]; then
  echo "  Mode: dry run"
fi
if [ "$AUTO_CONFIRM" -eq 1 ]; then
  echo "  Confirmation: auto"
fi
echo ""

if [ "$DRY_RUN" -eq 0 ] && [ "$AUTO_CONFIRM" -eq 0 ]; then
  read -r -p "Type YES to continue: " CONFIRM
  if [ "$CONFIRM" != "YES" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cleanup cancelled."
    exit 0
  fi
  echo ""
fi

# 1) Directory cleanup removes large generated folders in a single pass.
while IFS= read -r -d '' dir; do
  remove_path "$dir"
done < <(
  find "$ROOT" \
    -type d \
    \( "${CLEAN_DIR_NAME_MATCHERS[@]}" \) \
    -prune \
    -print0
)

# 2) File cleanup skips directories that are already scheduled for deletion.
while IFS= read -r -d '' file; do
  remove_file "$file"
done < <(
  find "$ROOT" \
    \( -type d \( "${CLEAN_DIR_NAME_MATCHERS[@]}" \) -prune \) \
    -o \
    \( -type f \( "${CLEAN_FILE_NAME_MATCHERS[@]}" \) -print0 \)
)

echo ""
if [ "$DRY_RUN" -eq 1 ]; then
  echo "Done. Found $deleted item(s) to remove."
else
  echo "Done. Removed $deleted item(s)."
fi
echo ""
