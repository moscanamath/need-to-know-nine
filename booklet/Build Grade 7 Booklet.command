#!/bin/bash
cd "$(dirname "$0")"
echo "Setting up (only slow the first time)..."
npm install
echo ""
echo "Building the Grade 7 booklet (10 days)..."
node build-booklet.js 7 10
echo ""
echo "Done! Look for booklet-grade7.html in this same folder, then open it and use Print > Save as PDF."
echo "Press Enter to close this window."
read
