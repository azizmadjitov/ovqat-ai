-- ============================================
-- Optimize user_meals table indexes for fast queries
-- ============================================

-- Drop old index if exists
DROP INDEX IF EXISTS idx_user_meals_user_id_date;

-- Create composite index for the most common query pattern:
-- WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_user_meals_user_date_created 
ON user_meals(user_id, date DESC, created_at DESC);

-- This index will speed up:
-- 1. Filtering by user_id (most selective)
-- 2. Date range queries (gte/lte)
-- 3. Sorting by created_at (already in index)

-- Verify index was created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_meals'
ORDER BY indexname;
