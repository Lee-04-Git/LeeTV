import AsyncStorage from "@react-native-async-storage/async-storage";

const VIDROCK_PROGRESS_KEY = "@vidrock_progress";

// Performance: Cache to reduce AsyncStorage reads
let progressCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Save Vidrock progress data with validation and deduplication
 * @param {Array} mediaDataArray - Array of media items from Vidrock
 */
export const saveVidrockProgress = async (mediaDataArray) => {
  try {
    if (!Array.isArray(mediaDataArray)) {
      console.error("❌ Invalid data: expected array");
      return;
    }

    // Validate and clean data
    const validData = mediaDataArray.filter(item => {
      if (!item || typeof item !== 'object') return false;
      if (!item.id || !item.type || !item.title) return false;
      if (item.type !== 'movie' && item.type !== 'tv') return false;
      return true;
    });

    // Deduplicate by id + type
    const uniqueMap = new Map();
    validData.forEach(item => {
      const key = `${item.type}-${item.id}`;
      const existing = uniqueMap.get(key);
      // Keep the most recent version
      if (!existing || (item.last_updated || 0) > (existing.last_updated || 0)) {
        uniqueMap.set(key, item);
      }
    });

    const cleanedData = Array.from(uniqueMap.values());
    
    await AsyncStorage.setItem(VIDROCK_PROGRESS_KEY, JSON.stringify(cleanedData));
    
    // Update cache
    progressCache = cleanedData;
    cacheTimestamp = Date.now();
    
    console.log(`💾 Saved ${cleanedData.length} items to storage`);
  } catch (error) {
    console.error("❌ Error saving Vidrock progress:", error);
  }
};

/**
 * Get raw Vidrock progress data with caching
 * @returns {Promise<Array>} Raw array of Vidrock media items
 */
export const getRawVidrockProgress = async () => {
  try {
    // Return cached data if still valid
    if (progressCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      return progressCache;
    }

    const stored = await AsyncStorage.getItem(VIDROCK_PROGRESS_KEY);
    if (!stored) {
      progressCache = [];
      cacheTimestamp = Date.now();
      return [];
    }

    const progressData = JSON.parse(stored);
    
    if (!Array.isArray(progressData)) {
      console.error("❌ Invalid data format");
      progressCache = [];
      cacheTimestamp = Date.now();
      return [];
    }
    
    // Update cache
    progressCache = progressData;
    cacheTimestamp = Date.now();
    
    return progressData;
  } catch (error) {
    console.error("❌ Error getting raw progress:", error);
    return [];
  }
};

/**
 * Get all continue watching items with transformation
 * @returns {Promise<Array>} Array of media items with watch progress
 */
export const getVidrockContinueWatching = async () => {
  try {
    const progressData = await getRawVidrockProgress();
    
    // Sort by last_updated (most recent first)
    const sorted = progressData.sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0));
    
    // Transform to app format
    const transformed = sorted.map(item => {
      const progress_percent = calculateProgressPercent(item);
      
      // Extract TV show data with strict validation
      let last_season = null;
      let last_episode = null;
      
      if (item.type === "tv") {
        const season = parseInt(item.last_season_watched, 10);
        const episode = parseInt(item.last_episode_watched, 10);
        
        if (!isNaN(season) && season > 0) last_season = season;
        if (!isNaN(episode) && episode > 0) last_episode = episode;
      }
      
      return {
        id: item.id,
        media_id: item.id,
        type: item.type,
        media_type: item.type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
        progress_percent,
        last_updated: item.last_updated,
        // TV show specific
        last_season_watched: last_season,
        last_episode_watched: last_episode,
        number_of_seasons: item.number_of_seasons,
        number_of_episodes: item.number_of_episodes,
        // Raw data for iframe
        progress: item.progress,
        show_progress: item.show_progress,
      };
    });
    
    // Filter: TV shows must have valid season/episode, movies always valid
    const valid = transformed.filter(item => {
      if (item.type === "tv") {
        return item.last_season_watched && item.last_episode_watched;
      }
      return true;
    });
    
    console.log(`📺 Loaded ${valid.length} continue watching items`);
    return valid;
  } catch (error) {
    console.error("❌ Error getting continue watching:", error);
    return [];
  }
};

/**
 * Calculate progress percentage from Vidrock data
 * @param {Object} item - Vidrock media item
 * @returns {number} Progress percentage (0-100)
 */
const calculateProgressPercent = (item) => {
  try {
    if (item.type === "tv" && item.show_progress && item.last_season_watched && item.last_episode_watched) {
      const episodeKey = `s${item.last_season_watched}e${item.last_episode_watched}`;
      const episodeProgress = item.show_progress[episodeKey];
      
      if (episodeProgress?.progress) {
        const { watched, duration } = episodeProgress.progress;
        if (duration > 0) {
          return Math.min(Math.round((watched / duration) * 100), 100);
        }
      }
    } else if (item.type === "movie" && item.progress) {
      const { watched, duration } = item.progress;
      if (duration > 0) {
        return Math.min(Math.round((watched / duration) * 100), 100);
      }
    }
  } catch (error) {
    console.error("❌ Error calculating progress:", error);
  }
  
  return 0;
};

/**
 * Get progress for a specific episode
 * @param {number} showId - TMDB show ID
 * @param {number} seasonNumber - Season number
 * @param {number} episodeNumber - Episode number
 * @returns {Promise<Object|null>} Episode progress data or null
 */
export const getEpisodeProgress = async (showId, seasonNumber, episodeNumber) => {
  try {
    const progressData = await getRawVidrockProgress();
    const show = progressData.find(item => item.id === showId && item.type === "tv");
    
    if (!show || !show.show_progress) return null;
    
    const episodeKey = `s${seasonNumber}e${episodeNumber}`;
    const episodeProgress = show.show_progress[episodeKey];
    
    if (!episodeProgress?.progress) return null;
    
    const { watched, duration } = episodeProgress.progress;
    const progress_percent = duration > 0 ? Math.min(Math.round((watched / duration) * 100), 100) : 0;
    
    return {
      watched,
      duration,
      progress_percent,
      last_updated: episodeProgress.last_updated,
    };
  } catch (error) {
    console.error("❌ Error getting episode progress:", error);
    return null;
  }
};

/**
 * Get progress for a specific movie
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object|null>} Movie progress data or null
 */
export const getMovieProgress = async (movieId) => {
  try {
    const progressData = await getRawVidrockProgress();
    const movie = progressData.find(item => item.id === movieId && item.type === "movie");
    
    if (!movie || !movie.progress) return null;
    
    const { watched, duration } = movie.progress;
    const progress_percent = duration > 0 ? Math.min(Math.round((watched / duration) * 100), 100) : 0;
    
    return {
      watched,
      duration,
      progress_percent,
    };
  } catch (error) {
    console.error("❌ Error getting movie progress:", error);
    return null;
  }
};

/**
 * Update progress for currently playing media (performance optimized)
 * Only updates the specific item without full reload
 * @param {number} mediaId - TMDB media ID
 * @param {string} mediaType - "movie" or "tv"
 * @param {Object} progressData - Progress data to update
 * @param {Object} metadata - Additional metadata (title, poster, etc.)
 */
export const updateCurrentProgress = async (mediaId, mediaType, progressData, metadata = {}) => {
  try {
    const existingData = await getRawVidrockProgress();
    const itemIndex = existingData.findIndex(item => item.id === mediaId && item.type === mediaType);
    
    const timestamp = Date.now();
    
    if (itemIndex >= 0) {
      // Update existing item
      const item = existingData[itemIndex];
      item.last_updated = timestamp;
      
      if (mediaType === "tv" && progressData.season && progressData.episode) {
        item.last_season_watched = String(progressData.season);
        item.last_episode_watched = String(progressData.episode);
        
        if (!item.show_progress) item.show_progress = {};
        item.show_progress[`s${progressData.season}e${progressData.episode}`] = {
          season: String(progressData.season),
          episode: String(progressData.episode),
          progress: { 
            watched: progressData.currentTime, 
            duration: progressData.duration 
          },
          last_updated: timestamp
        };
      } else if (mediaType === "movie") {
        item.progress = { 
          watched: progressData.currentTime, 
          duration: progressData.duration 
        };
      }
      
      existingData[itemIndex] = item;
    } else {
      // Add new item
      const newItem = {
        id: mediaId,
        type: mediaType,
        title: metadata.title || "Unknown",
        poster_path: metadata.poster_path || null,
        backdrop_path: metadata.backdrop_path || null,
        last_updated: timestamp,
      };
      
      if (mediaType === "tv" && progressData.season && progressData.episode) {
        newItem.last_season_watched = String(progressData.season);
        newItem.last_episode_watched = String(progressData.episode);
        newItem.number_of_seasons = metadata.number_of_seasons;
        newItem.number_of_episodes = metadata.number_of_episodes;
        newItem.show_progress = {
          [`s${progressData.season}e${progressData.episode}`]: {
            season: String(progressData.season),
            episode: String(progressData.episode),
            progress: { 
              watched: progressData.currentTime, 
              duration: progressData.duration 
            },
            last_updated: timestamp
          }
        };
      } else if (mediaType === "movie") {
        newItem.progress = { 
          watched: progressData.currentTime, 
          duration: progressData.duration 
        };
      }
      
      existingData.push(newItem);
    }
    
    await saveVidrockProgress(existingData);
    return true;
  } catch (error) {
    console.error("❌ Error updating current progress:", error);
    return false;
  }
};

/**
 * Clear all Vidrock progress data
 */
export const clearVidrockProgress = async () => {
  try {
    await AsyncStorage.removeItem(VIDROCK_PROGRESS_KEY);
    progressCache = null;
    cacheTimestamp = 0;
    console.log("✅ Vidrock progress cleared");
  } catch (error) {
    console.error("❌ Error clearing progress:", error);
  }
};

/**
 * Remove a specific item from Vidrock progress
 * @param {number} mediaId - TMDB media ID
 * @param {string} mediaType - "movie" or "tv"
 * @returns {Promise<Object>} Result object with success status
 */
export const removeVidrockProgressItem = async (mediaId, mediaType) => {
  try {
    if (!mediaId || !mediaType) {
      return { success: false, error: "Invalid parameters" };
    }

    if (mediaType !== "movie" && mediaType !== "tv") {
      return { success: false, error: "Invalid mediaType" };
    }

    const existingData = await getRawVidrockProgress();
    
    if (!existingData || existingData.length === 0) {
      return { success: true, message: "No data to remove" };
    }

    const itemToRemove = existingData.find(
      item => item.id === mediaId && item.type === mediaType
    );

    if (!itemToRemove) {
      return { success: true, message: "Item not found" };
    }

    console.log(`🗑️ Removing: ${itemToRemove.title} (${mediaType} ${mediaId})`);

    const updatedData = existingData.filter(
      item => !(item.id === mediaId && item.type === mediaType)
    );

    await saveVidrockProgress(updatedData);
    
    console.log(`✅ Removed. Remaining: ${updatedData.length}`);
    
    return { 
      success: true, 
      removed: itemToRemove,
      remainingCount: updatedData.length 
    };
  } catch (error) {
    console.error("❌ Error removing item:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Invalidate cache (call after external updates)
 */
export const invalidateCache = () => {
  progressCache = null;
  cacheTimestamp = 0;
};
