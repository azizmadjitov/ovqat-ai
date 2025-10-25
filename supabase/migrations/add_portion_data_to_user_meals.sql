-- Add portion_data column to user_meals table
-- This stores AI-estimated portion weight and confidence data as JSON

ALTER TABLE user_meals 
ADD COLUMN IF NOT EXISTS portion_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN user_meals.portion_data IS 'AI-estimated portion data including mass_g (value, low, high, confidence) and method';

-- Create index for faster queries on portion data
CREATE INDEX IF NOT EXISTS idx_user_meals_portion_data 
ON user_meals USING GIN (portion_data);

-- Example portion_data structure:
-- {
--   "mass_g": {
--     "value": 380,
--     "low": 340,
--     "high": 420,
--     "confidence": 0.85
--   },
--   "method": "plate_area_estimate"
-- }
