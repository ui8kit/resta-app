#!/usr/bin/env bash
#
# Install a new UI8Kit app from scaffold config.
# 1. Scaffold app (vite, tsconfig, postcss, css, etc.)
# 2. bun install
# 3. Engine generate
# 4. Copy templates to target app
#
# Config: scripts/app-scaffold.config.json (appName, target, etc.)
#
# Run from repo root:
#   bash scripts/installer.sh
#

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "  UI8Kit App Installer"
echo "  ───────────────────"
echo ""

# 1. Scaffold
echo "  1. Scaffolding app..."
bun run scripts/scaffold-app.ts
echo ""

# 2. Install packages
echo "  2. Running bun install..."
bun install
echo ""

# 3. Engine generate
echo "  3. Generating engine templates..."
cd "$ROOT/apps/engine"
bun run generate
cd "$ROOT"
echo ""

# 4. Copy to target (read from config)
TARGET_APP=$(bun run scripts/scaffold-config.ts --field appName)
TARGET_APP=${TARGET_APP:-test}
DOMAIN=$(bun run scripts/scaffold-config.ts --field domain)
DOMAIN=${DOMAIN:-website}
DATA_MODE=$(bun run scripts/scaffold-config.ts --field dataMode)
DATA_MODE=${DATA_MODE:-local}
echo "  4. Syncing templates + data to apps/$TARGET_APP (domain: $DOMAIN, data: $DATA_MODE)..."
TARGET_APP="$TARGET_APP" DOMAIN="$DOMAIN" DATA_MODE="$DATA_MODE" bun run scripts/pipeline-app.ts sync --target "$TARGET_APP" --domain "$DOMAIN" --data-mode "$DATA_MODE"
echo ""

echo "  Done. Run: cd apps/$TARGET_APP && bun run dev"
echo ""
