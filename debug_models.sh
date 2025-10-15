#!/bin/bash

echo "=== Morpheus Models Debug Script ==="
echo ""

# Test the official Ollama search page
echo "1. Testing Ollama.com search page directly..."
curl -s -H "Accept: text/html" -H "User-Agent: Morpheus-Client/1.0" \
  "https://ollama.com/search" | grep -c "x-test-model"

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
echo "3. Manual CSP test - checking if Ollama.com fetch works in browser..."
echo "Open browser console on any HTTPS site and run:"
echo "fetch('https://ollama.com/search').then(r=>r.text()).then(html=>console.log(html.match(/x-test-model/g)?.length + ' models found'))"

echo ""
echo "✅ Debug steps ready!"
