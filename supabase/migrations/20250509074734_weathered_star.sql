/*
  # Add fallback column to family_trees table

  1. Changes
    - Add `fallback` boolean column to `family_trees` table with default value of false
    - This column indicates whether the family tree was generated using fallback data

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_trees' 
    AND column_name = 'fallback'
  ) THEN
    ALTER TABLE family_trees ADD COLUMN fallback boolean DEFAULT false;
  END IF;
END $$;