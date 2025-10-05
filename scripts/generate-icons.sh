#!/usr/bin/env bash
# Helper: generate Android icons from resources/android using cordova-res
set -e
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
RES_DIR="$ROOT_DIR/resources/android"
if [ ! -d "$RES_DIR" ]; then
  echo "Create $RES_DIR and place icon.png (1024x1024) or foreground.png/background.png"
  exit 1
fi
if ! command -v cordova-res >/dev/null 2>&1; then
  echo "cordova-res not found. Installing locally..."
  npm install -D cordova-res
fi
npx cordova-res android --skip-config --copy

echo "Icons generated and copied to android/app/src/main/res/. Run: npx cap sync android && npx cap open android"
