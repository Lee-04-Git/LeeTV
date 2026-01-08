import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "../constants/colors";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { FullscreenIcon } from "../components/Icons";
import { saveWatchProgress } from "../services/supabaseService";

// Conditionally import WebView only for mobile
let WebView = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const VideoPlayerScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const title = params.title || "";
  const mediaId = params.mediaId || params.id;
  const mediaType = params.mediaType || params.type || "movie";
  const season = params.season || 1;
  const episode = params.episode || 1;

  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef(null);
  const webViewRef = useRef(null);
  const watchHistorySavedRef = useRef(false);
  const progressIntervalRef = useRef(null);
  const currentTimeRef = useRef(0);
  const [videoUrl, setVideoUrl] = useState("");

  // Storage key for this specific video
  const getStorageKey = () => {
    if (mediaType === "tv") {
      return `vidrock_progress_${mediaId}_S${season}E${episode}`;
    }
    return `vidrock_progress_${mediaId}`;
  };

  // Save current progress to AsyncStorage
  const saveProgress = async (seconds) => {
    if (seconds < 5) return; // Don't save if barely watched
    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify({
        currentTime: Math.floor(seconds),
        timestamp: Date.now(),
      }));
      console.log(`Progress saved: ${Math.floor(seconds)}s`);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Load saved progress from AsyncStorage
  const loadProgress = async () => {
    try {
      const key = getStorageKey();
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log(`Loaded saved progress: ${parsed.currentTime}s`);
        return parsed.currentTime || 0;
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
    return 0;
  };

  // Construct the video URL with resume time parameter
  const buildVideoUrl = async () => {
    let url =
      mediaType === "tv"
        ? `https://vidrock.net/tv/${mediaId}/${season}/${episode}`
        : `https://vidrock.net/movie/${mediaId}`;

    // VidRock params - autoplay, no download button, explicitly unmuted
    const params = ["autoplay=1", "download=false", "muted=0"];
    if (mediaType === "tv") {
      params.push("autonext=1");
    }

    // VidRock uses its own localStorage to remember position - it will auto-resume
    // We track progress separately for Continue Watching display
    const savedTime = await loadProgress();
    if (savedTime > 10) {
      console.log(`VidRock will auto-resume from last position (we tracked ${savedTime}s)`);
    }

    return url + "?" + params.join("&");
  };

  // Build video URL on mount
  useEffect(() => {
    buildVideoUrl().then(setVideoUrl);
  }, []);

  // Save to watch history for continue watching
  const saveToWatchHistory = async () => {
    if (watchHistorySavedRef.current) return;
    
    try {
      await saveWatchProgress({
        media_id: mediaId,
        media_type: mediaType,
        title: title,
        poster_path: params.poster_path || null,
        backdrop_path: params.backdrop_path || null,
        season_number: mediaType === "tv" ? season : null,
        episode_number: mediaType === "tv" ? episode : null,
        episode_title: mediaType === "tv" ? params.episodeTitle : null,
        progress_seconds: 0, // VidRock localStorage handles actual progress
        duration_seconds: mediaType === "tv" ? 2400 : 6000,
      });
      watchHistorySavedRef.current = true;
      console.log(`Added to watch history: ${title} ${mediaType === "tv" ? `S${season}E${episode}` : ""}`);
    } catch (error) {
      console.error("Failed to save watch history:", error);
    }
  };

  useEffect(() => {
    // VidRock localStorage automatically handles resume - no need to track ourselves

    // Allow auto-rotation on mobile
    if (Platform.OS !== "web") {
      ScreenOrientation.unlockAsync();
    }

    // Hide navigation bar on Android
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }

    // Handle Android back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );

    // Save to watch history after 5 seconds (for continue watching list)
    const watchHistoryTimer = setTimeout(() => {
      saveToWatchHistory();
    }, 5000);

    // Track progress - save every 10 seconds
    progressIntervalRef.current = setInterval(() => {
      saveProgress(currentTimeRef.current);
    }, 10000);

    return () => {
      backHandler.remove();
      clearTimeout(watchHistoryTimer);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Save final progress on exit
      saveProgress(currentTimeRef.current);
      // Lock back to portrait when leaving
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      }
      // Show navigation bar again on Android
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
      }
    };
  }, []);

  const handleOrientationToggle = async () => {
    if (Platform.OS === "web") return;

    const orientation = await ScreenOrientation.getOrientationAsync();
    if (
      orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    ) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      );
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    }
  };

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [showControls]);

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleControls = () => setShowControls(!showControls);

  const handleRetry = () => {
    setError(null);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // Early return only if no mediaId
  if (!mediaId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load video. Missing media ID.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading while videoUrl is being built
  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { marginTop: 20 }]}>
            Loading video...
          </Text>
        </View>
      </View>
    );
  }

  // Render for Web
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.videoWrapper}>
          <iframe
            src={videoUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
          />
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backBtn,
              { position: "absolute", top: 20, left: 20, zIndex: 100 },
            ]}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // HTML for WebView - VidRock player handles everything via localStorage
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background-color: #000; overflow: hidden; }
        iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
        [id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"], [id*="popup"], [class*="popup"] {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <iframe 
        src="${videoUrl}"
        id="videoFrame"
        allowfullscreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope"
        referrerpolicy="origin"
      ></iframe>
      
      <script>
        // Block ads and popups only
        window.open = function() { return null; };
        window.alert = function() {};
        
        // Remove ads periodically
        setInterval(() => {
          document.querySelectorAll('[id*="banner"], [class*="banner"], [id*="popup"], [class*="popup"]').forEach(el => el.remove());
        }, 3000);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoWrapper}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent, baseUrl: "https://vidrock.net" }}
            style={styles.video}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            onError={(e) => setError(e.nativeEvent.description)}
            mixedContentMode="always"
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            nestedScrollEnabled={true}
            allowsProtectedMedia={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            incognito={false}
            startInLoadingState={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'progress' && data.currentTime) {
                  currentTimeRef.current = data.currentTime;
                }
              } catch (error) {
                // Ignore parse errors
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url.toLowerCase();
              const adPatterns = [
                "doubleclick",
                "googlesyndication",
                "ads.",
                "/ads/",
                "popads",
                "adnxs",
                "advertising",
                "taboola",
                "outbrain",
              ];

              const allowedDomains = [
                "vidrock.net",
                "vidsrc.net",
                "vidrock",
                "image.tmdb.org",
                "about:blank",
              ];
              const isAllowed = allowedDomains.some((domain) =>
                url.includes(domain)
              );

              if (isAllowed) return true;
              if (url === videoUrl.toLowerCase() || url === "about:blank")
                return true;

              for (const pattern of adPatterns) {
                if (url.includes(pattern)) {
                  return false;
                }
              }

              return true;
            }}
          />

          {showControls && (
            <View style={styles.controlsOverlay}>
              <View style={styles.topBar}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  {mediaType === "tv" && (
                    <Text style={styles.episodeInfo}>
                      Season {season} • Episode {episode}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleOrientationToggle}
                  style={[styles.backBtn, { marginLeft: 15 }]}
                >
                  <FullscreenIcon size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    backgroundColor: "#000",
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  episodeInfo: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  backButton: {
    backgroundColor: colors.primary || "#E50914",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: colors.primary || "#E50914",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VideoPlayerScreen;
