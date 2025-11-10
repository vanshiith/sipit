#!/bin/bash

echo "🚀 Starting Sip-It Test Frontend..."
echo ""
echo "📋 Instructions:"
echo "1. Make sure your backend is running on port 3001"
echo "2. The test frontend will open in your default browser"
echo ""
echo "Press any key to continue..."
read -n 1 -s

# Open the test frontend
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open index.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open index.html
else
    # Windows
    start index.html
fi

echo "✅ Test frontend opened!"
echo ""
echo "💡 Tip: Open the browser console (F12) to see detailed logs"
echo "📚 See README.md for complete testing instructions"
