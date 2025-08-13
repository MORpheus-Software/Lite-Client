#!/bin/bash

echo "=== Cleaning All Build Output Files ==="
echo ""

# Remove Electron Forge output directory
echo "1. Removing out/ directory..."
rm -rf out/

# Remove webpack build cache
echo "2. Removing .webpack/ directory..."
rm -rf .webpack/

# Remove any existing packaged apps
echo "3. Removing any .app files in root directory..."
rm -rf *.app

# Remove any zip files
echo "4. Removing build zip files..."
rm -f Morpheus.app.zip

# Remove any temporary build files
echo "5. Removing temporary build files..."
rm -rf dist/
rm -rf build/

echo ""
echo "✅ All build output files have been removed!"
echo "You can now run 'yarn build' for a completely fresh build."