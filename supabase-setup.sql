-- SQL Scripts for LeeTV Supabase Database Setup
-- Run these queries in your Supabase SQL Editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  avatar_color_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_list table for movies and TV shows
CREATE TABLE IF NOT EXISTS user_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  vote_average DECIMAL(3,1),
  release_date TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_list_user_id ON user_list(user_id);
CREATE INDEX IF NOT EXISTS idx_user_list_media ON user_list(media_id, media_type);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_list ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for user_profiles (allow all for now, adjust as needed)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Create policies for user_list (allow all for now, adjust as needed)
CREATE POLICY "Allow all operations on user_list" ON user_list
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Instructions:
-- 1. Open your Supabase project dashboard at https://heagxebvbirbhhedghng.supabase.co
-- 2. Go to the SQL Editor section
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify tables are created in the Table Editor
