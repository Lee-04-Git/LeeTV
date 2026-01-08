-- SQL Script to create watch_history table for Continue Watching feature
-- Run this in your Supabase SQL Editor

-- Create watch_history table
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  
  -- For TV shows
  season_number INTEGER,
  episode_number INTEGER,
  episode_title TEXT,
  
  -- Progress tracking
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one entry per user per media
  -- For TV shows: unique per episode (user_id, media_id, season, episode)
  -- For movies: unique per movie (user_id, media_id)
  UNIQUE(user_id, media_id, media_type, season_number, episode_number)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_last_watched ON watch_history(last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_media ON watch_history(media_id, media_type);

-- Enable Row Level Security (RLS)
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Create policy for watch_history (allow all for now)
CREATE POLICY "Allow all operations on watch_history" ON watch_history
  FOR ALL USING (true) WITH CHECK (true);

-- Instructions:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor
-- 3. If you already ran this script before, first drop the old table:
--    DROP TABLE IF EXISTS watch_history CASCADE;
-- 4. Copy and paste this ENTIRE script
-- 5. Click "Run" to execute
-- 6. Verify the table is created in Table Editor with the new unique constraint
