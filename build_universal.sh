#!/bin/bash

echo "=== Building Morpheus for Multiple Architectures ==="
echo ""

# Clean previous builds
echo "1. Cleaning previous builds..."
./clean_build.sh

# Build for Apple Silicon (ARM64) - default
echo "2. Building for Apple Silicon (ARM64)..."
yarn make --arch=arm64

# Build for Intel (x64)
echo "3. Building for Intel (x64)..."
yarn make --arch=x64

echo ""
echo "✅ Builds completed!"
echo ""

# Show what was built
echo "=== Build Artifacts ==="
find out/make -name "*.dmg" -o -name "*.zip" | sort

echo ""
echo "You now have:"
echo "- ARM64 version for Apple Silicon Macs"
echo "- x64 version for Intel Macs"
echo ""
echo "Both versions are signed and ready for distribution."
