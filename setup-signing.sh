#!/bin/bash

echo "=== Apple Code Signing & Notarization Setup ==="
echo ""

# Set the Developer ID (from the certificate we found)
export APPLE_DEVELOPER_ID="Developer ID Application: Better Brand Management LLC (ZA3KN2X4MN)"

echo "Using Developer ID Certificate: $APPLE_DEVELOPER_ID"
echo ""

# Set Apple ID (from your input)
export APPLE_ID="scott@betterbrand.com"

# Set Team ID (you'll need to provide this)
read -p "Enter your Team ID (from Apple Developer account): " APPLE_TEAM_ID
export APPLE_TEAM_ID="$APPLE_TEAM_ID"

# Set App-specific password
read -s -p "Enter your App-specific password: " APPLE_ID_PASSWORD
export APPLE_ID_PASSWORD="$APPLE_ID_PASSWORD"
echo ""

echo ""
echo "=== Environment Variables Set ==="
echo "APPLE_DEVELOPER_ID: $APPLE_DEVELOPER_ID"
echo "APPLE_ID: $APPLE_ID"
echo "APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo "APPLE_ID_PASSWORD: [hidden]"
echo ""

echo "Now you can run: npm run make"
echo "The package will be signed and notarized automatically."
echo ""
echo "To make these permanent, add them to your ~/.zshrc or ~/.bash_profile:"
echo "export APPLE_DEVELOPER_ID=\"$APPLE_DEVELOPER_ID\""
echo "export APPLE_ID=\"$APPLE_ID\""
echo "export APPLE_TEAM_ID=\"$APPLE_TEAM_ID\""
echo "export APPLE_ID_PASSWORD=\"$APPLE_ID_PASSWORD\"" 