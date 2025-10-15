#!/bin/bash

set -e

RELEASE_TYPE=${1:-daily}

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(daily|patch|minor|major)$ ]]; then
    echo "❌ Invalid release type: $RELEASE_TYPE"
    echo "Usage: $0 [daily|patch|minor|major]"
    exit 1
fi

CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null)

# Validate version was read successfully
if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Failed to read version from package.json"
    exit 1
fi

echo "=== Morpheus Release Creator ==="
echo "Release Type: $RELEASE_TYPE"
echo "Current Version: $CURRENT_VERSION"
echo ""

# Function to increment version
increment_version() {
    local version=$1
    local type=$2
    
    case $type in
        "daily")
            # For daily releases, increment the daily number (e.g., 0.7.4-daily.7 -> 0.7.4-daily.8)
            if [[ $version =~ ^([0-9]+\.[0-9]+\.[0-9]+)-daily\.([0-9]+)$ ]]; then
                base_version="${BASH_REMATCH[1]}"
                daily_num="${BASH_REMATCH[2]}"
                new_daily_num=$((daily_num + 1))
                echo "${base_version}-daily.${new_daily_num}"
            elif [[ $version =~ ^([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
                # If it's a stable version, make it daily.1
                echo "${version}-daily.1"
            else
                echo "❌ Invalid version format for daily release: $version" >&2
                return 1
            fi
            ;;
        "patch"|"minor"|"major")
            # Use yarn to increment version
            local temp_version
            temp_version=$(yarn version --$type --no-git-tag-version --silent 2>/dev/null)
            if [ $? -eq 0 ]; then
                node -p "require('./package.json').version"
            else
                echo "❌ Failed to increment $type version" >&2
                return 1
            fi
            ;;
    esac
}

# Calculate new version
NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$RELEASE_TYPE")

# Validate new version was calculated
if [ -z "$NEW_VERSION" ]; then
    echo "❌ Failed to calculate new version"
    exit 1
fi

# For daily releases, update package.json manually since yarn doesn't handle prerelease increments
if [[ "$RELEASE_TYPE" == "daily" ]]; then
    # Escape special characters for sed
    ESCAPED_CURRENT=$(printf '%s\n' "$CURRENT_VERSION" | sed 's/[[\.*^$()+?{|]/\\&/g')
    ESCAPED_NEW=$(printf '%s\n' "$NEW_VERSION" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Update package.json
    sed -i '' "s/\"version\": \"$ESCAPED_CURRENT\"/\"version\": \"$ESCAPED_NEW\"/" package.json
    
    # Verify the update worked
    UPDATED_VERSION=$(node -p "require('./package.json').version" 2>/dev/null)
    if [ "$UPDATED_VERSION" != "$NEW_VERSION" ]; then
        echo "❌ Failed to update package.json version"
        exit 1
    fi
fi

echo "New Version: $NEW_VERSION"
echo ""

# Set environment variable for prerelease detection
if [[ "$NEW_VERSION" == *"-daily."* ]]; then
    export IS_PRERELEASE=true
    echo "Setting IS_PRERELEASE=true for daily release"
else
    export IS_PRERELEASE=false
    echo "Setting IS_PRERELEASE=false for stable release"
fi
echo ""

# Check if artifacts exist
ARTIFACTS_DIR="out/make"
if [ ! -d "$ARTIFACTS_DIR" ]; then
    echo "❌ No build artifacts found in $ARTIFACTS_DIR"
    echo "Building artifacts now..."
    yarn build
fi

# Find artifacts after potential build
DMG_FILE=$(find "$ARTIFACTS_DIR" -name "*.dmg" 2>/dev/null | head -1)
ZIP_FILE=$(find "$ARTIFACTS_DIR" -name "*.zip" 2>/dev/null | head -1)

if [ -z "$DMG_FILE" ] || [ -z "$ZIP_FILE" ]; then
    echo "❌ Required artifacts not found (DMG and ZIP)"
    echo "Building artifacts now..."
    yarn build
    
    # Try to find artifacts again
    DMG_FILE=$(find "$ARTIFACTS_DIR" -name "*.dmg" 2>/dev/null | head -1)
    ZIP_FILE=$(find "$ARTIFACTS_DIR" -name "*.zip" 2>/dev/null | head -1)
    
    if [ -z "$DMG_FILE" ] || [ -z "$ZIP_FILE" ]; then
        echo "❌ Build failed to create required artifacts"
        exit 1
    fi
fi

echo "✅ Found artifacts:"
echo "   DMG: $(basename "$DMG_FILE")"
echo "   ZIP: $(basename "$ZIP_FILE")"
echo ""

# Create git tag
echo "🏷️  Creating git tag..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag "v$NEW_VERSION"

# Push changes and tag
echo "🚀 Pushing to GitHub..."
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
git push origin "v$NEW_VERSION"

echo ""
echo "✅ Release v$NEW_VERSION created successfully!"
echo ""
echo "The GitHub Actions release workflow will now:"
echo "1. Build signed & notarized artifacts for all platforms"
echo "2. Create a GitHub release (draft)"
echo "3. Upload artifacts to the release"
echo ""
echo "Monitor the release at: https://github.com/MORpheus-Software/Lite-Client/releases"
echo "Monitor the workflow at: https://github.com/MORpheus-Software/Lite-Client/actions"
