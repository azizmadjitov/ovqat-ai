# Supabase Setup for Ovqat AI

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your project URL and keys

### 2. Configure Environment

Update `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Update `server/.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=3001
```

### 3. Apply Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `migrations/001_initial_schema.sql`
3. Paste and click **Run**

### 4. Verify Setup

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'user_goals', 'user_meals');
```

Expected: 4 tables

## 📁 Structure

```
supabase/
├── README.md                    # This file
├── MIGRATION_GUIDE.md          # Detailed migration docs
├── migrations/
│   └── 001_initial_schema.sql  # Initial database schema
└── functions/                   # Edge functions (optional)
    ├── analyze-food/
    └── phone-auth/
```

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Core user data & auth |
| `user_profiles` | Questionnaire data |
| `user_goals` | Daily nutrition targets |
| `user_meals` | Meal history (4 days) |

## 🔒 Security

- ✅ RLS enabled on all tables
- ✅ Permissive policies (JWT auth via backend)
- ✅ Foreign key constraints
- ✅ Data validation via CHECK constraints

## 📖 Full Documentation

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for:
- Complete schema details
- RLS policy explanations
- Rollback instructions
- Common queries
- Troubleshooting

## 🛠️ Useful Commands

### Check RLS Policies

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### View Table Structure

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_meals'
ORDER BY ordinal_position;
```

### Count Records

```sql
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM user_profiles) as profiles,
    (SELECT COUNT(*) FROM user_goals) as goals,
    (SELECT COUNT(*) FROM user_meals) as meals;
```

## 🐛 Common Issues

### RLS blocks queries
→ Check policies with `SELECT * FROM pg_policies`

### Foreign key error
→ Ensure parent user exists in `users` table

### Duplicate meal_id
→ Use unique ISO timestamp for each meal

## 📞 Need Help?

1. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Review Supabase Dashboard logs
3. Verify environment variables
4. Check table relationships

---

**Quick Links:**
- [Supabase Dashboard](https://app.supabase.com)
- [SQL Editor](https://app.supabase.com/project/_/sql)
- [Table Editor](https://app.supabase.com/project/_/editor)
