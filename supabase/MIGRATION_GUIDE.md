# Ovqat AI Database Migration Guide

## 📋 Overview

This guide explains how to set up and migrate the Ovqat AI database schema in Supabase.

## 🗄️ Database Structure

### Tables

#### 1. **users**
Core user table storing authentication and basic info.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `phone` | TEXT | Phone number (unique, without +) |
| `onboarding_completed` | BOOLEAN | Whether user completed questionnaire |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_users_phone` - Fast phone lookup

---

#### 2. **user_profiles**
Stores questionnaire data and physical characteristics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `user_id` | UUID | Foreign key → users.id | User reference (unique) |
| `gender` | TEXT | 'male' or 'female' | User gender |
| `age` | INTEGER | 0-150 | User age |
| `weight_kg` | NUMERIC(5,2) | > 0 | Weight in kg |
| `height_cm` | NUMERIC(5,2) | > 0 | Height in cm |
| `workout_freq` | TEXT | See options below | Workout frequency |
| `primary_goal` | TEXT | 'lose', 'maintain', 'gain' | Fitness goal |
| `activity_level` | TEXT | See options below | Daily activity level |
| `diet_type` | TEXT | See options below | Diet preference |
| `created_at` | TIMESTAMPTZ | | Profile creation |
| `updated_at` | TIMESTAMPTZ | | Last update |

**workout_freq options:**
- `sedentary` - No exercise
- `light` - 1-2 times/week
- `moderate` - 3-4 times/week
- `active` - 5-6 times/week
- `very_active` - Daily intense workouts

**activity_level options:**
- `sedentary` - Desk job, minimal movement
- `light` - Light activity, some walking
- `moderate` - Moderate activity, regular movement
- `very_active` - Very active job, lots of movement

**diet_type options:**
- `balanced` - Balanced diet
- `low_carb` - Low carbohydrate
- `high_protein` - High protein
- `vegan` - Plant-based

**Indexes:**
- `idx_user_profiles_user_id` - Fast user lookup

---

#### 3. **user_goals**
Calculated daily nutrition goals based on user profile.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `user_id` | UUID | Foreign key → users.id | User reference (unique) |
| `goal_calories` | INTEGER | > 0 | Daily calorie target |
| `goal_protein_g` | NUMERIC(6,2) | > 0 | Daily protein target (grams) |
| `goal_carbs_g` | NUMERIC(6,2) | > 0 | Daily carbs target (grams) |
| `goal_fat_g` | NUMERIC(6,2) | > 0 | Daily fat target (grams) |
| `created_at` | TIMESTAMPTZ | | Goals creation |
| `updated_at` | TIMESTAMPTZ | | Last update |

**Indexes:**
- `idx_user_goals_user_id` - Fast user lookup

---

#### 4. **user_meals**
Meal history with nutrition data from AI analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `user_id` | UUID | Foreign key → users.id | User reference |
| `meal_id` | TEXT | Unique per user | ISO timestamp string |
| `date` | DATE | | Meal date (YYYY-MM-DD) |
| `time` | TEXT | | Meal time (HH:MM) |
| `name` | TEXT | | Meal name (AI-generated) |
| `description` | TEXT | | Meal description (AI-generated) |
| `image_url` | TEXT | | Base64 or URL to meal photo |
| `calories` | INTEGER | >= 0 | Total calories |
| `protein_g` | NUMERIC(6,2) | >= 0 | Protein in grams |
| `carbs_g` | NUMERIC(6,2) | >= 0 | Carbs in grams |
| `fat_g` | NUMERIC(6,2) | >= 0 | Fat in grams |
| `fiber_g` | NUMERIC(6,2) | >= 0 | Fiber in grams |
| `health_score` | INTEGER | 0-10 | AI health rating |
| `language` | TEXT | | Language used for analysis |
| `created_at` | TIMESTAMPTZ | | Record creation |

**Constraints:**
- `UNIQUE(user_id, meal_id)` - Prevent duplicates

**Indexes:**
- `idx_user_meals_user_id_date` - Fast date-based queries
- `idx_user_meals_created_at` - Fast recent meals queries

---

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with permissive policies (`USING (true)`).

### Why permissive policies?

The app uses **JWT-based authentication** via backend API, not Supabase Auth. The backend validates tokens and passes the correct `user_id` to queries. RLS is enabled for security compliance, but policies are permissive since authentication happens at the API layer.

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | ✅ All | ✅ All | ✅ All | ❌ |
| `user_profiles` | ✅ All | ✅ All | ✅ All | ❌ |
| `user_goals` | ✅ All | ✅ All | ✅ All | ❌ |
| `user_meals` | ✅ All | ✅ All | ❌ | ✅ All |

---

## 🚀 Migration Instructions

### Prerequisites

1. Supabase project created
2. Project URL and keys configured in `.env`
3. Access to Supabase SQL Editor

### Step 1: Apply Initial Schema

1. Go to your Supabase project
2. Navigate to **SQL Editor** → **New Query**
3. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** button

### Step 2: Verify Migration

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'user_goals', 'user_meals');
```

Expected result: 4 rows

### Step 3: Verify RLS Policies

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected: Multiple policies for each table

### Step 4: Test Data Insertion

```sql
-- Test user creation
INSERT INTO users (id, phone) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', '998997961877')
RETURNING *;

-- Test profile creation
INSERT INTO user_profiles (
    user_id, gender, age, weight_kg, height_cm,
    workout_freq, primary_goal, activity_level, diet_type
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'male', 25, 75.5, 180.0,
    'moderate', 'maintain', 'moderate', 'balanced'
)
RETURNING *;

-- Clean up test data
DELETE FROM users WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

---

## 📊 Data Retention Policy

### user_meals Table

- **Retention:** Last 4 days (today + 3 days back)
- **Cleanup:** Manual or scheduled job
- **Max per day:** 20 meals per user (soft limit)

### Cleanup Query (Optional)

```sql
-- Delete meals older than 4 days
DELETE FROM user_meals 
WHERE date < CURRENT_DATE - INTERVAL '3 days';
```

To automate, create a Supabase Edge Function or cron job.

---

## 🔄 Future Migrations

### Creating a New Migration

1. Create file: `supabase/migrations/00X_description.sql`
2. Add migration SQL
3. Document changes in this guide
4. Apply via SQL Editor

### Migration Naming Convention

```
001_initial_schema.sql
002_add_meal_tags.sql
003_add_user_preferences.sql
```

---

## 🛠️ Rollback Instructions

### Rollback Migration 001

**⚠️ WARNING: This will delete ALL data!**

```sql
-- Drop tables in reverse order (respects foreign keys)
DROP TABLE IF EXISTS user_meals CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## 📝 Schema Diagram

```
┌─────────────┐
│   users     │
│ ─────────── │
│ id (PK)     │
│ phone       │
│ onboarding  │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────┐
│user_profiles │  │ user_goals   │
│ ──────────── │  │ ──────────── │
│ id (PK)      │  │ id (PK)      │
│ user_id (FK) │  │ user_id (FK) │
│ gender       │  │ goal_calories│
│ age          │  │ goal_protein │
│ weight_kg    │  │ goal_carbs   │
│ height_cm    │  │ goal_fat     │
│ workout_freq │  └──────────────┘
│ primary_goal │
│ activity_lvl │
│ diet_type    │
└──────────────┘
       │
       ▼
┌──────────────┐
│ user_meals   │
│ ──────────── │
│ id (PK)      │
│ user_id (FK) │
│ meal_id      │
│ date         │
│ time         │
│ name         │
│ description  │
│ image_url    │
│ calories     │
│ protein_g    │
│ carbs_g      │
│ fat_g        │
│ fiber_g      │
│ health_score │
└──────────────┘
```

---

## 🔍 Common Queries

### Get user with profile and goals

```sql
SELECT 
    u.*,
    p.gender, p.age, p.weight_kg, p.height_cm,
    g.goal_calories, g.goal_protein_g, g.goal_carbs_g, g.goal_fat_g
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN user_goals g ON u.id = g.user_id
WHERE u.phone = '998997961877';
```

### Get meals for last 4 days

```sql
SELECT *
FROM user_meals
WHERE user_id = 'USER_ID_HERE'
AND date >= CURRENT_DATE - INTERVAL '3 days'
ORDER BY created_at DESC
LIMIT 80;
```

### Calculate daily nutrition totals

```sql
SELECT 
    date,
    SUM(calories) as total_calories,
    SUM(protein_g) as total_protein,
    SUM(carbs_g) as total_carbs,
    SUM(fat_g) as total_fat
FROM user_meals
WHERE user_id = 'USER_ID_HERE'
AND date = CURRENT_DATE
GROUP BY date;
```

---

## 🐛 Troubleshooting

### Issue: RLS blocks queries

**Solution:** Verify policies are created:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Issue: Foreign key constraint fails

**Solution:** Ensure parent record exists in `users` table first.

### Issue: Duplicate meal_id

**Solution:** Each meal_id must be unique per user. Use ISO timestamp for meal_id.

---

## 📞 Support

For issues or questions:
1. Check Supabase logs in Dashboard
2. Review RLS policies
3. Verify data types match schema
4. Check foreign key relationships

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** October 25, 2025  
**Schema Version:** 001  
**Maintained by:** Ovqat AI Team
