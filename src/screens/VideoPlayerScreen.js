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
} from "react-native";
import colors from "../constants/colors";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { FullscreenIcon } from "../components/Icons";

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
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);
  const webViewRef = useRef(null);

  useEffect(() => {
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

    return () => {
      backHandler.remove();
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

  // Construct the video URL - VidRock handles ALL progress via its own localStorage
  const buildVideoUrl = () => {
    let url =
      mediaType === "tv"
        ? `https://vidrock.net/tv/${mediaId}/${season}/${episode}`
        : `https://vidrock.net/movie/${mediaId}`;

    // VidRock params - autoplay and no download button
    const params = ["autoplay=true", "download=false"];
    if (mediaType === "tv") {
      params.push("autonext=true");
    }

    return url + "?" + params.join("&");
  };

  const videoUrl = buildVideoUrl();

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
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerpolicy="origin"
      ></iframe>
      
      <script>
        // Block ads and popups
        window.open = function() { return null; };
        window.alert = function() {};
        
        setInterval(() => {
          document.querySelectorAll('[id*="ad"], [class*="ad"]').forEach(el => el.remove());
        }, 1000);
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
            onError={(e) => setError(e.nativeEvent.description)}
            mixedContentMode="always"
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            nestedScrollEnabled={true}
            allowsProtectedMedia={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
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
