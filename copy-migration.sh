#!/bin/bash

echo "📋 Copying all SQL migrations to clipboard..."

# Create a temporary file to combine all migrations
TEMP_FILE=$(mktemp)

# Add a header
echo "-- Ovqat AI Database Migrations" > "$TEMP_FILE"
echo "-- Apply in order: 001, 002, 003, 004" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Append each migration file in order
echo "-- ============================================" >> "$TEMP_FILE"
echo "-- Migration 001: Initial Schema" >> "$TEMP_FILE"
echo "-- ============================================" >> "$TEMP_FILE"
cat supabase/migrations/001_initial_schema.sql >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

echo "-- ============================================" >> "$TEMP_FILE"
echo "-- Migration 002: Security Fixes" >> "$TEMP_FILE"
echo "-- ============================================" >> "$TEMP_FILE"
cat supabase/migrations/002_security_fixes.sql >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

echo "-- ============================================" >> "$TEMP_FILE"
echo "-- Migration 003: Function Search Path Fix" >> "$TEMP_FILE"
echo "-- ============================================" >> "$TEMP_FILE"
cat supabase/migrations/003_fix_function_search_path.sql >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

echo "-- ============================================" >> "$TEMP_FILE"
echo "-- Migration 004: User Account Linking Fix" >> "$TEMP_FILE"
echo "-- ============================================" >> "$TEMP_FILE"
cat supabase/migrations/004_fix_user_account_linking.sql >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Copy to clipboard
cat "$TEMP_FILE" | pbcopy

# Clean up
rm "$TEMP_FILE"

echo ""
echo "✅ All SQL Migrations copied to clipboard!"
echo ""
echo "📌 Next steps:"
echo "1. Open Supabase SQL Editor:"
echo "   https://app.supabase.com/project/_/sql/new"
echo ""
echo "2. Paste the SQL (Cmd+V or Ctrl+V)"
echo ""
echo "3. Run each migration section in order (001, 002, 003, 004)"
echo "   - Select the SQL for each migration and click 'RUN'"
echo ""
echo "4. Wait for success messages for each migration"
echo ""
echo "✅ Done! Then test with: npm run dev"
echo ""