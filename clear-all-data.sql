-- Migration to clear all data from user_list and watch_history tables
-- Run this in Supabase SQL Editor to reset all user data

-- Clear all watch history (continue watching data)
DELETE FROM watch_history;

-- Clear all user list items
DELETE FROM user_list;

-- Verify tables are empty
SELECT COUNT(*) as watch_history_count FROM watch_history;
SELECT COUNT(*) as user_list_count FROM user_list;

-- Success message
SELECT 'All data cleared successfully!' as status;
