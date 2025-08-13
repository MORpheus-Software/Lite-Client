#!/bin/bash

echo "=== Complete Morpheus Uninstallation ==="
echo ""

# Remove main application
echo "1. Removing main application..."
sudo rm -rf "/Applications/Morpheus.app"

# Remove application data and settings
echo "2. Removing application data and settings..."
rm -rf ~/Library/Application\ Support/Morpheus
rm -rf ~/Library/Application\ Support/morpheus
rm -rf ~/Library/Preferences/com.electron.morpheus.plist
rm -rf ~/Library/Saved\ Application\ State/com.electron.morpheus.savedState

# Remove caches and logs
echo "3. Removing caches and logs..."
rm -rf ~/Library/Caches/Morpheus
rm -rf ~/Library/Caches/morpheus
rm -rf ~/Library/Logs/Morpheus

# Remove any remaining Electron-related files
echo "4. Removing any remaining Electron files..."
rm -rf ~/Library/Application\ Support/Electron/morpheus*

# Check for any remaining processes
echo "5. Checking for running processes..."
pkill -f "Morpheus" 2>/dev/null || echo "No running Morpheus processes found"

echo ""
echo "✅ Morpheus has been completely uninstalled!"
echo "You can now install and test the latest build."
