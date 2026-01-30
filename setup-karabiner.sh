#!/bin/bash

echo "🎹 Temu Keyboard Mapper - Karabiner Setup"
echo "=========================================="
echo ""

# Check if Karabiner-Elements is installed
if [ -d "/Applications/Karabiner-Elements.app" ]; then
    echo "✅ Karabiner-Elements is already installed!"
else
    echo "📦 Installing Karabiner-Elements..."

    if command -v brew &> /dev/null; then
        brew install --cask karabiner-elements
        echo "✅ Karabiner-Elements installed!"
    else
        echo "❌ Homebrew not found."
        echo "📥 Download manually from: https://karabiner-elements.pqrs.org/"
        exit 1
    fi
fi

# Create config directory
KARABINER_DIR="$HOME/.config/karabiner/assets/complex_modifications"
if [ ! -d "$KARABINER_DIR" ]; then
    echo "📁 Creating Karabiner config directory..."
    mkdir -p "$KARABINER_DIR"
    echo "✅ Directory created!"
else
    echo "✅ Config directory exists!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the mapper: npm start"
echo "2. Open: http://localhost:3000"
echo "3. Configure your buttons and click Save"
echo "4. Your mappings will auto-sync to Karabiner!"
echo ""
echo "To enable mappings in Karabiner-Elements:"
echo "  - Open Karabiner-Elements app"
echo "  - Go to Complex Modifications tab"
echo "  - Click 'Add Rule'"
echo "  - Enable 'Temu Side Keyboard Mappings'"
