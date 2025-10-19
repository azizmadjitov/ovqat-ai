#!/bin/bash

echo "📋 Copying SQL migration to clipboard..."
cat supabase/migrations/001_initial_schema.sql | pbcopy

echo ""
echo "✅ SQL Migration copied to clipboard!"
echo ""
echo "📌 Next steps:"
echo "1. Open Supabase SQL Editor:"
echo "   https://app.supabase.com/project/djnbuvumslqlpvdyjnrt/sql/new"
echo ""
echo "2. Paste the SQL (Cmd+V or Ctrl+V)"
echo ""
echo "3. Click the green 'RUN' button"
echo ""
echo "4. Wait for success message"
echo ""
echo "✅ Done! Then test with: npm run dev"
echo ""
