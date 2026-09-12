#!/bin/bash
set -e

TMP_DMG=$(mktemp /tmp/Resursee_XXXXXX.dmg)
MOUNT_DIR=$(mktemp -d /tmp/Resursee_Mount_XXXXXX)

cleanup() {
  hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true
  rm -rf "$MOUNT_DIR" "$TMP_DMG" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Downloading Resursee for macOS (2.1 MB)..."
curl -fL -# -o "$TMP_DMG" "https://github.com/JohnDivina/Resursee/releases/download/v0.1.0/Resursee_0.1.0_aarch64.dmg"

echo "==> Mounting installer..."
hdiutil attach "$TMP_DMG" -mountpoint "$MOUNT_DIR" -nobrowse -quiet

echo "==> Installing to /Applications/Resursee.app..."
rm -rf /Applications/Resursee.app
cp -R "$MOUNT_DIR/Resursee.app" /Applications/

echo "==> Authorizing local execution..."
xattr -cr /Applications/Resursee.app 2>/dev/null || true

echo "==> Resursee installed successfully!"
echo "==> Launching Resursee..."
open -a Resursee
