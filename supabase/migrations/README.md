# Database Migrations

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy the SQL from the migration file
5. Paste and **Run** the query

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Migration History

### `add_portion_data_to_user_meals.sql`

**Date:** October 25, 2025  
**Purpose:** Add AI portion estimation data to meals

**Changes:**
- Add `portion_data` JSONB column to `user_meals` table
- Store weight estimation (value, low, high, confidence)
- Add GIN index for faster queries

**To Apply:**

```sql
-- Copy and run in Supabase SQL Editor
ALTER TABLE user_meals 
ADD COLUMN IF NOT EXISTS portion_data JSONB;

COMMENT ON COLUMN user_meals.portion_data IS 'AI-estimated portion data including mass_g (value, low, high, confidence) and method';

CREATE INDEX IF NOT EXISTS idx_user_meals_portion_data 
ON user_meals USING GIN (portion_data);
```

**Verification:**

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_meals' 
AND column_name = 'portion_data';

-- Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'user_meals' 
AND indexname = 'idx_user_meals_portion_data';
```

## Rollback

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_user_meals_portion_data;

-- Remove column
ALTER TABLE user_meals DROP COLUMN IF EXISTS portion_data;
```

## Testing

After applying the migration:

1. Add a new meal with AI analysis
2. Check that `portion_data` is saved:
   ```sql
   SELECT meal_id, portion_data 
   FROM user_meals 
   WHERE portion_data IS NOT NULL 
   LIMIT 5;
   ```
3. Open the meal from history
4. Verify weight badge displays correctly

---

**Note:** Always backup your database before applying migrations!
