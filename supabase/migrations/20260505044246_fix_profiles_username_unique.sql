/*
  # Fix: Remove unique constraint on profiles.username

  The UNIQUE constraint on `username` was causing "Database error saving new user"
  during signup. When the trigger auto-creates a profile, it derives the username
  from the email prefix (e.g., "test" from "test@gmail.com"). If another user
  with the same email prefix signs up, the UNIQUE constraint fails and rolls back
  the entire auth signup transaction.

  1. Changes
    - Drop the `profiles_username_key` unique constraint
    - Keep the `username` column as nullable text (no unique requirement)
    - Update the trigger to handle potential NULL usernames gracefully

  2. Security
    - No security changes (RLS policies remain the same)
*/

-- Drop the unique constraint on username
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Update the trigger function to handle username conflicts gracefully
-- by appending a short random suffix when a duplicate would occur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_username text;
  final_username text;
  suffix text;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Try the base username first
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = base_username) THEN
    final_username := base_username;
  ELSE
    -- Append a random 4-digit suffix to avoid collision
    suffix := floor(random() * 9000 + 1000)::text;
    final_username := base_username || '_' || suffix;
  END IF;

  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;
