-- Add language column to user_meals table
ALTER TABLE user_meals 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'en';

-- Update existing records to have default language
UPDATE user_meals 
SET language = 'en' 
WHERE language IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE user_meals 
ALTER COLUMN language SET NOT NULL;
