# Настройка таблицы user_meals в Supabase

## 📋 Инструкция

### 1. Откройте Supabase Dashboard
Перейдите на https://app.supabase.com и откройте ваш проект

### 2. Откройте SQL Editor
- Нажмите на "SQL Editor" в левом меню
- Нажмите "New Query"

### 3. Скопируйте и выполните SQL

Скопируйте содержимое файла `migrations/create_user_meals_table.sql` и выполните его в SQL Editor.

Или выполните эту команду:

```sql
-- Create user_meals table for storing meal history
CREATE TABLE IF NOT EXISTS user_meals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_id TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  calories INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  fiber_g INTEGER NOT NULL,
  health_score DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, meal_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_meals_user_id_date ON user_meals(user_id, date DESC);

-- Enable RLS
ALTER TABLE user_meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to see only their own meals
CREATE POLICY "Users can view their own meals" ON user_meals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own meals" ON user_meals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own meals" ON user_meals
  FOR DELETE USING (user_id = auth.uid());
```

### 4. Если используется кастомная аутентификация (не Supabase Auth)

Если вы используете кастомный backend для аутентификации (как в вашем случае), отключите RLS:

```sql
ALTER TABLE user_meals DISABLE ROW LEVEL SECURITY;
```

Это позволит приложению напрямую обращаться к таблице через service role key.

## ✅ Проверка

После создания таблицы:
1. Откройте "Table Editor" в левом меню
2. Должна появиться таблица `user_meals`
3. Проверьте, что есть все колонки

## 🚀 Готово!

Теперь приложение может:
- ✅ Сохранять блюда в Supabase
- ✅ Загружать блюда при открытии приложения
- ✅ Хранить блюда за последние 4 дня
- ✅ Максимум 20 блюд в день на пользователя

## 📝 Требования

- Блюда хранятся за последние 4 дня (сегодня и минус 3 дня)
- Максимум 20 блюд в день на пользователя
- Каждое блюдо уникально по (user_id, meal_id)
- Быстрые запросы благодаря индексу по (user_id, date)
