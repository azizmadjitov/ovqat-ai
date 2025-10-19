#!/bin/bash

echo "🔐 Applying Supabase Security Fixes..."
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed (Node.js required)"
    echo "📦 Install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Using npx supabase"
echo ""

# Check if logged in
echo "🔐 Checking authentication..."
if ! npx supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔑 Run: npx supabase login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Link project if not already linked
echo "🔗 Linking project..."
npx supabase link --project-ref djnbuvumslqlpvdyjnrt --password '' 2>/dev/null || echo "✅ Project already linked"
echo ""

# Apply security fixes
echo "🛡️  Applying security fixes..."
npx supabase sql -f fix-security-warnings.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Security fixes applied successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Enable Leaked Password Protection in Supabase Dashboard:"
    echo "   Authentication → Settings → Leaked Password Protection → Enable"
    echo ""
    echo "2. Check Supabase Security Advisor - warnings should be resolved"
    echo ""
else
    echo "❌ Failed to apply security fixes"
    exit 1
fi