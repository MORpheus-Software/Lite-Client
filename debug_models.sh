#!/bin/bash

echo "=== Morpheus Models Debug Script ==="
echo ""

# Test the API endpoint directly
echo "1. Testing ollamadb.dev API directly..."
curl -s -H "Accept: application/json" -H "User-Agent: Morpheus-Client/1.0" \
  "https://ollamadb.dev/api/v1/models?limit=5&skip=0&sort_by=pulls&order=desc" | head -200

echo ""
echo ""

# Check if the app is in development mode
echo "2. Checking if app can run in development mode with DevTools..."
echo "Run: yarn start"
echo "This will open DevTools automatically where you can see:"
echo "  - Console errors"
echo "  - Network requests"
echo "  - CSP violations"

echo ""
echo "3. Manual CSP test - checking if fetch works in browser..."
echo "Open browser console on any HTTPS site and run:"
echo "fetch('https://ollamadb.dev/api/v1/models?limit=5&skip=0').then(r=>r.json()).then(console.log)"

echo ""
echo "✅ Debug steps ready!"
