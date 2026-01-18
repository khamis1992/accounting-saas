#!/bin/bash

# Mobile Menu Enhancement Setup Script
# This script installs dependencies and sets up the enhanced mobile menu

set -e

echo "================================"
echo "Mobile Menu Enhancement Setup"
echo "================================"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the frontend directory"
    exit 1
fi

# Step 1: Install framer-motion
echo "📦 Installing framer-motion..."
npm install framer-motion@^11.15.0

if [ $? -eq 0 ]; then
    echo "✅ framer-motion installed successfully"
else
    echo "❌ Failed to install framer-motion"
    exit 1
fi

echo ""

# Step 2: Check if enhanced sidebar exists
if [ -f "components/layout/sidebar-enhanced.tsx" ]; then
    echo "✅ Enhanced sidebar component found"
else
    echo "❌ Enhanced sidebar component not found"
    echo "Please ensure sidebar-enhanced.tsx exists in components/layout/"
    exit 1
fi

# Step 3: Ask if user wants to replace original sidebar
echo ""
read -p "Replace original sidebar with enhanced version? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup original
    if [ -f "components/layout/sidebar.tsx" ]; then
        echo "💾 Backing up original sidebar to sidebar.original.tsx..."
        mv components/layout/sidebar.tsx components/layout/sidebar.original.tsx

        # Use enhanced version
        echo "🔄 Activating enhanced sidebar..."
        mv components/layout/sidebar-enhanced.tsx components/layout/sidebar.tsx

        echo "✅ Enhanced sidebar is now active"
    else
        echo "⚠️  Original sidebar not found, cannot backup"
    fi
else
    echo "⏭️  Skipping sidebar replacement"
    echo "You can manually import the enhanced sidebar:"
    echo "  import { Sidebar as EnhancedSidebar } from './sidebar-enhanced';"
fi

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Open browser DevTools"
echo "3. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)"
echo "4. Test mobile menu functionality"
echo ""
echo "For detailed testing instructions, see:"
echo "  MOBILE_MENU_ENHANCEMENT_GUIDE.md"
echo ""
echo "Happy coding! 🚀"
