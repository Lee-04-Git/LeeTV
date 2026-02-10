-- Create search_history table for storing user search queries with full title details
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  media_type TEXT NOT NULL, -- 'movie' or 'tv'
  year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title_id, media_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own search history
CREATE POLICY "Users can view their own search history"
  ON search_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own search history
CREATE POLICY "Users can insert their own search history"
  ON search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own search history
CREATE POLICY "Users can delete their own search history"
  ON search_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy: Users can update their own search history
CREATE POLICY "Users can update their own search history"
  ON search_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
