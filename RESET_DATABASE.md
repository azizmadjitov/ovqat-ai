# Сброс базы данных для тестирования

## ⚠️ Внимание!
Эта операция **удалит все данные** из базы данных. Используйте только для тестирования!

## 📋 Инструкция

### 1. Откройте Supabase Dashboard
Перейдите на https://app.supabase.com и откройте ваш проект

### 2. Откройте SQL Editor
- Нажмите на "SQL Editor" в левом меню
- Нажмите "New Query"

### 3. Выполните SQL скрипт

Скопируйте и выполните следующий SQL:

```sql
-- Reset all database tables for fresh testing

-- Delete all meals
DELETE FROM user_meals;

-- Delete all user goals
DELETE FROM user_goals;

-- Delete all user profiles
DELETE FROM user_profiles;

-- Delete all users
DELETE FROM users;

-- Reset sequences (if any)
ALTER SEQUENCE IF EXISTS user_meals_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 'user_meals' as table_name, COUNT(*) as row_count FROM user_meals
UNION ALL
SELECT 'user_goals', COUNT(*) FROM user_goals
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'users', COUNT(*) FROM users;
```

## ✅ Проверка

После выполнения скрипта должны увидеть результат:
```
table_name      | row_count
----------------|----------
user_meals      | 0
user_goals      | 0
user_profiles   | 0
users           | 0
```

## 🚀 Готово!

Теперь база данных пуста и вы можете начать тестирование с чистого листа.

## 📝 Что будет удалено

- ✅ Все блюда пользователей
- ✅ Все цели пользователей
- ✅ Все профили пользователей
- ✅ Все пользователи

## ⚡ Быстрый сброс

Если нужно часто сбрасывать базу, можно создать SQL Query в Supabase и сохранить его для быстрого доступа.
