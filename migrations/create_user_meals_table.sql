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

-- Alternative: If using custom auth without Supabase Auth, use this instead:
-- ALTER TABLE user_meals DISABLE ROW LEVEL SECURITY;
-- This allows direct access via service role key
