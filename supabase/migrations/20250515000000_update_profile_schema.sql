
-- Add the missing fields to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS biography text,
ADD COLUMN IF NOT EXISTS birth_year text,
ADD COLUMN IF NOT EXISTS birth_place text,
ADD COLUMN IF NOT EXISTS tribe text,
ADD COLUMN IF NOT EXISTS clan text;
