import { supabase } from "../config/supabase";
import { auth } from "../config/firebase";

// Get current user ID from Firebase
const getUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

// ===== USER PROFILE OPERATIONS =====

export const saveUserProfile = async (profileData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { name, avatarSeed, avatarColorIndex } = profileData;

    // Check if profile exists
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      result = await supabase
        .from("user_profiles")
        .update({
          name,
          avatar_seed: avatarSeed,
          avatar_color_index: avatarColorIndex,
        })
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      // Insert new profile
      result = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          name,
          avatar_seed: avatarSeed,
          avatar_color_index: avatarColorIndex,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return result.data;
  } catch (error) {
    console.error("Error saving profile:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is ok for first time users
      throw error;
    }

    if (data) {
      return {
        name: data.name,
        avatarSeed: data.avatar_seed,
        avatarColorIndex: data.avatar_color_index,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting profile:", error);
    return null;
  }
};

// ===== USER LIST OPERATIONS =====

export const addToList = async (media) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const {
      id,
      media_type,
      type,
      title,
      name,
      poster_path,
      backdrop_path,
      vote_average,
      release_date,
      first_air_date,
    } = media;

    const mediaType = media_type || type || "movie";
    const mediaTitle = title || name;

    console.log("Adding to list:", {
      title: mediaTitle,
      media_type: mediaType,
      poster_path: poster_path,
      id: id,
    });

    const { data, error } = await supabase
      .from("user_list")
      .insert({
        user_id: userId,
        media_id: id,
        media_type: mediaType,
        title: mediaTitle,
        poster_path,
        backdrop_path,
        vote_average,
        release_date: release_date || first_air_date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding to list:", error);
    throw error;
  }
};

export const removeFromList = async (mediaId, mediaType) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("user_list")
      .delete()
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing from list:", error);
    throw error;
  }
};

export const getUserList = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("user_list")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting user list:", error);
    return [];
  }
};

export const isInList = async (mediaId, mediaType) => {
  try {
    const userId = getUserId();
    if (!userId) return false;

    const { data, error } = await supabase
      .from("user_list")
      .select("id")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking if in list:", error);
    return false;
  }
};

// ===== WATCH HISTORY OPERATIONS =====

export const saveWatchProgress = async (watchData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const {
      media_id,
      media_type,
      title,
      poster_path,
      backdrop_path,
      season_number,
      episode_number,
      episode_title,
      progress_seconds,
      duration_seconds,
    } = watchData;

    const progress_percentage =
      duration_seconds > 0 ? (progress_seconds / duration_seconds) * 100 : 0;

    // For TV shows, we need to track each episode separately
    // For movies, we track the movie itself
    const conflictColumns =
      media_type === "tv"
        ? "user_id,media_id,media_type,season_number,episode_number"
        : "user_id,media_id,media_type,season_number,episode_number"; // Use all columns for movies too (season/episode will be null)

    // Use upsert to update if exists or insert if new
    const { data, error } = await supabase
      .from("watch_history")
      .upsert(
        {
          user_id: userId,
          media_id,
          media_type,
          title,
          poster_path,
          backdrop_path,
          season_number: season_number || null,
          episode_number: episode_number || null,
          episode_title: episode_title || null,
          progress_seconds,
          duration_seconds,
          progress_percentage: progress_percentage.toFixed(2),
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: conflictColumns,
        }
      )
      .select()
      .single();

    if (error) throw error;
    console.log("Watch progress saved to Supabase:", data);
    return data;
  } catch (error) {
    console.error("Error saving watch progress:", error);
    throw error;
  }
};

export const getContinueWatching = async (mediaType = null) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    // Get all watch history for the user
    let query = supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .order("last_watched_at", { ascending: false });

    // Filter by media type if specified
    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // For TV shows: Keep only the LATEST episode per show (by media_id)
    // For movies: Keep only the LATEST entry per movie (by media_id)
    const uniqueContent = [];
    const seenShowIds = new Set();
    const seenMovieIds = new Set();

    for (const item of data || []) {
      if (item.media_type === "tv") {
        // For TV shows, only add if we haven't seen this show yet
        if (!seenShowIds.has(item.media_id)) {
          uniqueContent.push(item);
          seenShowIds.add(item.media_id);
        }
      } else {
        // For movies, only add if we haven't seen this movie yet
        if (!seenMovieIds.has(item.media_id)) {
          uniqueContent.push(item);
          seenMovieIds.add(item.media_id);
        }
      }
    }

    console.log(
      `Returning ${uniqueContent.length} unique continue watching items`
    );
    return uniqueContent.slice(0, 10); // Limit to 10 items
  } catch (error) {
    console.error("Error getting continue watching:", error);
    return [];
  }
};

export const getWatchProgress = async (
  mediaId,
  mediaType,
  season = null,
  episode = null
) => {
  try {
    const userId = getUserId();
    if (!userId) return null;

    // Build query to find specific watch history
    let query = supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType);

    // If TV show details are provided, filter by them
    if (mediaType === "tv" && season && episode) {
      query = query.eq("season_number", season).eq("episode_number", episode);
    }

    const { data, error } = await query
      .order("last_watched_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting watch progress:", error);
    return null;
  }
};

export const removeWatchHistory = async (mediaId, mediaType) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing watch history:", error);
    throw error;
  }
};
