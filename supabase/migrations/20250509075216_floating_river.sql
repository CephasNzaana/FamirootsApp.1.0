/*
  # Create family trees table with fallback column

  1. New Tables
    - `family_trees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `surname` (text)
      - `tribe` (text)
      - `clan` (text)
      - `members` (jsonb)
      - `fallback` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `family_trees` table
    - Add policies for authenticated users
*/

-- Create the family_trees table
CREATE TABLE IF NOT EXISTS family_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  surname text NOT NULL,
  tribe text NOT NULL,
  clan text NOT NULL,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own family trees"
  ON family_trees
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE id = user_id
  ));

CREATE POLICY "Users can insert their own family trees"
  ON family_trees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE id = user_id
  ));

CREATE POLICY "Users can update their own family trees"
  ON family_trees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE id = user_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE id = user_id
  ));

CREATE POLICY "Users can delete their own family trees"
  ON family_trees
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE id = user_id
  ));