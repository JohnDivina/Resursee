#!/bin/bash
set -e

echo "==> Downloading Resursee for macOS (Apple Silicon)..."
TMP_DMG="/tmp/Resursee_0.1.0_aarch64.dmg"
curl -fL -o "$TMP_DMG" "https://github.com/JohnDivina/Resursee/releases/download/v0.1.0/Resursee_0.1.0_aarch64.dmg"

echo "==> Mounting installer..."
hdiutil attach "$TMP_DMG" -nobrowse -quiet

echo "==> Installing Resursee to /Applications..."
rm -rf /Applications/Resursee.app
cp -R /Volumes/Resursee/Resursee.app /Applications/

echo "==> Unmounting installer..."
hdiutil detach /Volumes/Resursee -quiet 2>/dev/null || true
rm -f "$TMP_DMG"

echo "==> Authorizing local execution..."
xattr -cr /Applications/Resursee.app 2>/dev/null || true

echo "==> Resursee installed successfully!"
echo "==> Launching Resursee..."
open -a Resursee
