#!/bin/bash

echo "🚀 Deploying Supabase Edge Function..."
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

# Set OpenAI API key secret
echo "🔑 Setting OpenAI API key secret..."
echo "⚠️  This will be set as a server-side secret (not visible in browser)"

# Check if OPENAI_API_KEY environment variable is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable is not set"
    echo "💡 Usage: OPENAI_API_KEY=your-key-here ./deploy-supabase.sh"
    exit 1
fi

npx supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Secret set successfully"
else
    echo "❌ Failed to set secret"
    exit 1
fi
echo ""

# Deploy function
echo "📤 Deploying analyze-food function..."
npx supabase functions deploy analyze-food --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📍 Function URL:"
    echo "   https://djnbuvumslqlpvdyjnrt.supabase.co/functions/v1/analyze-food"
    echo ""
    echo "📊 View logs:"
    echo "   npx supabase functions logs analyze-food"
    echo ""
    echo "🌐 Dashboard:"
    echo "   https://supabase.com/dashboard/project/djnbuvumslqlpvdyjnrt/functions"
else
    echo "❌ Deployment failed"
    exit 1
fi
