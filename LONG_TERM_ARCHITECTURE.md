# Long-Term Architecture for Continue Watching

## Current Issues

### 1. **Tight Coupling**
- ❌ Hardcoded to Vidrock's data structure
- ❌ Can't easily switch video providers
- ❌ Vidrock API changes break our app

### 2. **Storage Limitations**
- ❌ AsyncStorage limited to ~6MB
- ❌ No cross-device sync
- ❌ Data lost on uninstall
- ❌ No backup/restore

### 3. **No Versioning**
- ❌ Schema changes break old data
- ❌ No migration strategy
- ❌ Hard to update structure

### 4. **Scalability**
- ❌ All data in memory
- ❌ No pagination
- ❌ Performance degrades with many items

### 5. **No Monitoring**
- ❌ Can't track failures
- ❌ No usage metrics
- ❌ Hard to debug issues

## Recommended Long-Term Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Video Player Screen                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Video Provider Adapter                     │ │
│  │  (Vidrock, YouTube, Vimeo, Custom, etc.)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Progress Tracking Service                     │ │
│  │  • Normalizes data from any provider                   │ │
│  │  • Handles save/load logic                             │ │
│  │  • Manages sync and conflicts                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Storage Layer (Abstracted)                 │ │
│  │  • Local: AsyncStorage / SQLite                        │ │
│  │  • Remote: Supabase / Firebase                         │ │
│  │  • Hybrid: Local + Cloud sync                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1. **Video Provider Adapter Pattern**

Create an abstraction layer for video providers:

```javascript
// src/services/videoProviders/BaseVideoProvider.js
export class BaseVideoProvider {
  constructor(config) {
    this.config = config;
  }
  
  // Must be implemented by subclasses
  async getVideoUrl(mediaId, mediaType, options) {
    throw new Error("Not implemented");
  }
  
  async trackProgress(progressData) {
    throw new Error("Not implemented");
  }
  
  async getProgress(mediaId, mediaType) {
    throw new Error("Not implemented");
  }
  
  // Normalize data to common format
  normalizeProgressData(rawData) {
    return {
      id: rawData.id,
      type: rawData.type,
      title: rawData.title,
      currentTime: rawData.currentTime || 0,
      duration: rawData.duration || 0,
      lastUpdated: rawData.lastUpdated || Date.now(),
      metadata: rawData.metadata || {},
    };
  }
}

// src/services/videoProviders/VidrockProvider.js
export class VidrockProvider extends BaseVideoProvider {
  async getVideoUrl(mediaId, mediaType, options) {
    const { season, episode } = options;
    if (mediaType === "tv") {
      return `https://vidrock.net/tv/${mediaId}/${season}/${episode}`;
    }
    return `https://vidrock.net/movie/${mediaId}`;
  }
  
  async trackProgress(progressData) {
    // Vidrock-specific tracking
    return this.normalizeProgressData(progressData);
  }
  
  normalizeProgressData(vidrockData) {
    // Convert Vidrock format to our standard format
    return {
      id: vidrockData.id,
      type: vidrockData.type,
      title: vidrockData.title,
      currentTime: vidrockData.progress?.watched || 0,
      duration: vidrockData.progress?.duration || 0,
      lastUpdated: vidrockData.last_updated,
      metadata: {
        posterPath: vidrockData.poster_path,
        backdropPath: vidrockData.backdrop_path,
        season: vidrockData.last_season_watched,
        episode: vidrockData.last_episode_watched,
        showProgress: vidrockData.show_progress,
      },
    };
  }
}

// Easy to add new providers
export class YouTubeProvider extends BaseVideoProvider {
  // YouTube-specific implementation
}

export class CustomProvider extends BaseVideoProvider {
  // Your own video server
}
```

### 2. **Progress Tracking Service (Provider-Agnostic)**

```javascript
// src/services/progressTrackingService.js
import { VidrockProvider } from './videoProviders/VidrockProvider';
import { StorageService } from './storageService';

class ProgressTrackingService {
  constructor() {
    // Can switch providers easily
    this.provider = new VidrockProvider();
    this.storage = new StorageService();
    this.version = "1.0.0"; // For data migration
  }
  
  async saveProgress(mediaId, mediaType, progressData) {
    try {
      // Normalize data from provider
      const normalized = this.provider.normalizeProgressData(progressData);
      
      // Add versioning
      const versionedData = {
        ...normalized,
        schemaVersion: this.version,
      };
      
      // Save to storage (handles local + cloud sync)
      await this.storage.save(mediaId, mediaType, versionedData);
      
      // Analytics (optional)
      this.trackEvent('progress_saved', { mediaId, mediaType });
      
      return { success: true };
    } catch (error) {
      console.error("Failed to save progress:", error);
      // Retry logic
      await this.retryWithBackoff(() => 
        this.storage.save(mediaId, mediaType, versionedData)
      );
      return { success: false, error };
    }
  }
  
  async getProgress(mediaId, mediaType) {
    try {
      const data = await this.storage.get(mediaId, mediaType);
      
      // Handle version migration
      if (data.schemaVersion !== this.version) {
        return this.migrateData(data);
      }
      
      return data;
    } catch (error) {
      console.error("Failed to get progress:", error);
      return null;
    }
  }
  
  async getAllProgress(options = {}) {
    const { limit = 50, offset = 0, sortBy = 'lastUpdated' } = options;
    
    // Pagination support
    return await this.storage.getAll({ limit, offset, sortBy });
  }
  
  // Data migration for schema changes
  migrateData(oldData) {
    const migrations = {
      "0.9.0": (data) => {
        // Migrate from old format
        return { ...data, newField: "default" };
      },
      "1.0.0": (data) => {
        // Current version
        return data;
      },
    };
    
    let migrated = oldData;
    const versions = Object.keys(migrations).sort();
    
    for (const version of versions) {
      if (version > oldData.schemaVersion) {
        migrated = migrations[version](migrated);
      }
    }
    
    migrated.schemaVersion = this.version;
    return migrated;
  }
  
  // Retry with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  // Analytics tracking (optional)
  trackEvent(eventName, data) {
    // Send to analytics service
    // Firebase Analytics, Mixpanel, etc.
  }
}

export default new ProgressTrackingService();
```

### 3. **Abstracted Storage Layer**

```javascript
// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

export class StorageService {
  constructor() {
    this.storageKey = '@progress_v1';
    this.syncEnabled = true; // Toggle cloud sync
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async save(mediaId, mediaType, data) {
    const key = `${mediaId}-${mediaType}`;
    
    // Save locally first (fast)
    await this.saveLocal(key, data);
    
    // Sync to cloud (background)
    if (this.syncEnabled) {
      this.syncToCloud(key, data).catch(error => {
        console.warn("Cloud sync failed:", error);
        // Queue for retry
        this.queueForRetry(key, data);
      });
    }
  }
  
  async get(mediaId, mediaType) {
    const key = `${mediaId}-${mediaType}`;
    
    // Try local first (fast)
    const local = await this.getLocal(key);
    
    // If local is recent, return it
    if (local && this.isRecent(local)) {
      return local;
    }
    
    // Otherwise, fetch from cloud
    if (this.syncEnabled) {
      try {
        const cloud = await this.getFromCloud(key);
        if (cloud) {
          // Update local cache
          await this.saveLocal(key, cloud);
          return cloud;
        }
      } catch (error) {
        console.warn("Cloud fetch failed:", error);
      }
    }
    
    // Fallback to local
    return local;
  }
  
  async getAll(options = {}) {
    const { limit, offset, sortBy } = options;
    
    // Try local first
    const local = await this.getAllLocal();
    
    // If we have enough local data, return it
    if (local.length >= limit + offset) {
      return this.paginate(local, limit, offset, sortBy);
    }
    
    // Otherwise, fetch from cloud
    if (this.syncEnabled) {
      try {
        const cloud = await this.getAllFromCloud(options);
        // Merge and cache
        await this.mergeAndCache(local, cloud);
        return cloud;
      } catch (error) {
        console.warn("Cloud fetch failed:", error);
      }
    }
    
    return this.paginate(local, limit, offset, sortBy);
  }
  
  // Local storage methods
  async saveLocal(key, data) {
    const stored = await AsyncStorage.getItem(this.storageKey);
    const all = stored ? JSON.parse(stored) : {};
    all[key] = { ...data, cachedAt: Date.now() };
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(all));
  }
  
  async getLocal(key) {
    const stored = await AsyncStorage.getItem(this.storageKey);
    if (!stored) return null;
    const all = JSON.parse(stored);
    return all[key] || null;
  }
  
  async getAllLocal() {
    const stored = await AsyncStorage.getItem(this.storageKey);
    if (!stored) return [];
    const all = JSON.parse(stored);
    return Object.values(all);
  }
  
  // Cloud storage methods (Supabase example)
  async syncToCloud(key, data) {
    const { error } = await supabase
      .from('watch_progress')
      .upsert({
        user_id: await this.getUserId(),
        media_key: key,
        data: data,
        updated_at: new Date().toISOString(),
      });
    
    if (error) throw error;
  }
  
  async getFromCloud(key) {
    const { data, error } = await supabase
      .from('watch_progress')
      .select('data')
      .eq('user_id', await this.getUserId())
      .eq('media_key', key)
      .single();
    
    if (error) throw error;
    return data?.data;
  }
  
  async getAllFromCloud(options) {
    const { limit, offset, sortBy } = options;
    
    const { data, error } = await supabase
      .from('watch_progress')
      .select('data')
      .eq('user_id', await this.getUserId())
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data.map(row => row.data);
  }
  
  // Helper methods
  isRecent(data) {
    const age = Date.now() - (data.cachedAt || 0);
    return age < this.cacheTimeout;
  }
  
  paginate(items, limit, offset, sortBy) {
    const sorted = items.sort((a, b) => 
      b[sortBy] - a[sortBy]
    );
    return sorted.slice(offset, offset + limit);
  }
  
  async getUserId() {
    // Get from auth service
    return "user-123";
  }
  
  queueForRetry(key, data) {
    // Implement retry queue
    // Could use a separate AsyncStorage key for failed syncs
  }
}
```

### 4. **Updated VideoPlayerScreen (Clean)**

```javascript
// src/screens/VideoPlayerScreen.js
import progressTrackingService from '../services/progressTrackingService';

const VideoPlayerScreen = ({ navigation, route }) => {
  const { mediaId, mediaType, season, episode, title } = route.params;
  
  // Get video URL from provider
  const videoUrl = progressTrackingService.provider.getVideoUrl(
    mediaId, 
    mediaType, 
    { season, episode }
  );
  
  // Handle progress updates
  const handleProgressUpdate = async (progressData) => {
    await progressTrackingService.saveProgress(
      mediaId,
      mediaType,
      progressData
    );
  };
  
  // Load existing progress
  useEffect(() => {
    const loadProgress = async () => {
      const progress = await progressTrackingService.getProgress(
        mediaId,
        mediaType
      );
      // Inject into player
    };
    loadProgress();
  }, []);
  
  // ... rest of component
};
```

## Benefits of This Architecture

### 1. **Flexibility**
- ✅ Easy to switch video providers
- ✅ Can use multiple providers simultaneously
- ✅ Provider-agnostic progress tracking

### 2. **Scalability**
- ✅ Pagination support
- ✅ Efficient data loading
- ✅ Cloud sync for unlimited storage

### 3. **Reliability**
- ✅ Local-first with cloud backup
- ✅ Retry logic with exponential backoff
- ✅ Graceful degradation

### 4. **Maintainability**
- ✅ Clear separation of concerns
- ✅ Easy to test each layer
- ✅ Version migration built-in

### 5. **Future-Proof**
- ✅ Schema versioning
- ✅ Data migration strategy
- ✅ Analytics integration ready

### 6. **User Experience**
- ✅ Cross-device sync
- ✅ Offline support
- ✅ Fast local access
- ✅ Background sync

## Migration Path

### Phase 1: Add Abstraction Layer (No Breaking Changes)
1. Create `BaseVideoProvider` and `VidrockProvider`
2. Create `ProgressTrackingService`
3. Keep existing code working
4. Gradually migrate to new service

### Phase 2: Add Storage Layer
1. Create `StorageService`
2. Implement local storage
3. Add cloud sync (optional)
4. Migrate existing AsyncStorage data

### Phase 3: Add Features
1. Pagination
2. Cross-device sync
3. Analytics
4. Advanced features

## Conclusion

The current implementation works but has limitations for long-term growth. The recommended architecture provides:

- **Flexibility** to change providers
- **Scalability** for many users and items
- **Reliability** with multiple save points
- **Maintainability** with clear structure
- **Future-proofing** with versioning and migration

You can migrate gradually without breaking existing functionality.
