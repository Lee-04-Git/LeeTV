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

export const saveLastWatched = async (watchData) => {
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
    } = watchData;

    // First, delete any existing entries for this media (to ensure only one per show/movie)
    await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", userId)
      .eq("media_id", media_id)
      .eq("media_type", media_type);

    // Then insert the new entry
    const { data, error } = await supabase
      .from("watch_history")
      .insert({
        user_id: userId,
        media_id,
        media_type,
        title,
        poster_path,
        backdrop_path,
        season_number: season_number || null,
        episode_number: episode_number || null,
        episode_title: episode_title || null,
        last_watched_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    console.log("Last watched saved to Supabase:", data);
    return data;
  } catch (error) {
    console.error("Error saving last watched:", error);
    throw error;
  }
};

export const getContinueWatching = async (mediaType = null) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

<<<<<<< HEAD
    // Get all watch history for the user (now unique per media_id already)
=======
    // Get all watch history for the user, ordered by most recent
>>>>>>> b0830ca5737073efb31f7bb6b462de4bfa6e452d
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

<<<<<<< HEAD
    console.log(`Returning ${data?.length || 0} continue watching items`);
    return (data || []).slice(0, 10); // Limit to 10 items
=======
    // Remove duplicates: Keep only the MOST RECENT entry per unique content
    // For TV shows: group by media_id to show most recent episode watched
    // For movies: group by media_id
    const uniqueContent = [];
    const seenIds = new Set();

    for (const item of data || []) {
      // Use media_id as unique identifier
      if (!seenIds.has(item.media_id)) {
        uniqueContent.push(item);
        seenIds.add(item.media_id);
      }
    }

    console.log(
      `Returning ${uniqueContent.length} unique continue watching items (most recent first)`
    );
    return uniqueContent.slice(0, 15); // Limit to 15 items
>>>>>>> b0830ca5737073efb31f7bb6b462de4bfa6e452d
  } catch (error) {
    console.error("Error getting continue watching:", error);
    return [];
  }
};

export const getLastWatched = async (mediaId, mediaType) => {
  try {
    const userId = getUserId();
    if (!userId) return null;

    // Get the last watched info for this media
    const { data, error } = await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .eq("media_type", mediaType)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting last watched:", error);
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

export const clearAllWatchHistory = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    console.log("All watch history cleared");
    return true;
  } catch (error) {
    console.error("Error clearing all watch history:", error);
    throw error;
  }
};

export const clearUserList = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("user_list")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    console.log("All items cleared from user list");
    return true;
  } catch (error) {
    console.error("Error clearing user list:", error);
    throw error;
  }
};
