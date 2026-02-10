# Search History Setup Guide

## Database Setup

To enable persistent search history, you need to create the `search_history` table in Supabase.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Run SQL Migration**
   - Navigate to SQL Editor in the left sidebar
   - Click "New Query"
   - Copy and paste the contents of `search-history-table.sql`
   - Click "Run" to execute

3. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see the new `search_history` table
   - Columns: id, user_id, query, created_at

## Features

### Search History
- **Persistent Storage**: Search queries are saved to Supabase per user
- **Auto-sync**: History syncs across devices when user logs in
- **Privacy**: Row Level Security ensures users only see their own history
- **Limit**: Keeps last 10 searches per user
- **Delete**: Users can remove individual search items

### Search Suggestions
- Shows 5 default suggestions when history is empty:
  - Action Movies
  - Comedy Series
  - Thriller Movies
  - Sci-Fi Series
  - Horror Movies

### Popular Movies
- Displays top 10 popular movies from TMDB
- Shows before user starts typing
- Updates on each app launch

## How It Works

1. User clicks search input → Focus mode activates
2. If history exists → Shows history + popular movies
3. If history empty → Shows suggestions + popular movies
4. User types → Search results appear
5. User selects result → Query saved to Supabase

## Table Schema

```sql
search_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, query)
)
```

## Security

- Row Level Security (RLS) enabled
- Users can only access their own search history
- Policies enforce user isolation
- Automatic cleanup on user deletion (CASCADE)
