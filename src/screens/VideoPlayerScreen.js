import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import Video from "react-native-video";
import { scrapeVideoUrl } from "../services/videoScraper";
import colors from "../constants/colors";

// Conditionally import WebView only for mobile
let WebView = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const VideoPlayerScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const title = params.title || "";
  const mediaId = params.mediaId || params.id;
  const mediaType = params.mediaType || params.type || "movie";
  const season = params.season || 1;
  const episode = params.episode || 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [scrapedVideoUrl, setScrapedVideoUrl] = useState(null);
  const [provider, setProvider] = useState(null);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const webViewRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  useEffect(() => {
    console.log("VideoPlayer params:", { title, mediaId, mediaType, season, episode });
    
    // Start scraping video URL immediately
    scrapeVideo();
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    
    return () => backHandler.remove();
  }, []);

  // Scrape video URL from providers
  const scrapeVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Scraping video URL...');
      const result = await scrapeVideoUrl(mediaId, mediaType, season, episode);
      
      if (result && result.url) {
        console.log('✅ Scraped successfully from:', result.provider);
        setScrapedVideoUrl(result.url);
        setProvider(result.provider);
        setUseNativePlayer(true);
        setLoading(false);
      } else {
        console.log('⚠️ Scraping failed, falling back to embed');
        setUseNativePlayer(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Scraping error:', err);
      setUseNativePlayer(false);
      setLoading(false);
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

  const handleBack = () => navigation.goBack();

  const toggleControls = () => setShowControls(!showControls);

  if (!mediaId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load video. Missing media ID.</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If scraping succeeded, use native video player (100% ad-free!)
  if (useNativePlayer && scrapedVideoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        
        <TouchableWithoutFeedback onPress={toggleControls}>
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: scrapedVideoUrl }}
              style={styles.video}
              controls={true}
              resizeMode="contain"
              repeat={false}
              paused={false}
              onLoad={() => {
                setLoading(false);
                console.log("✅ Video loaded successfully - AD FREE!");
              }}
              onError={(error) => {
                console.error("❌ Video playback error:", error);
                setError("Video playback failed");
                // Fallback to embed on error
                setUseNativePlayer(false);
                setLoading(false);
              }}
              onBuffer={({ isBuffering }) => {
                console.log(isBuffering ? "Buffering..." : "Playing");
              }}
              fullscreen={true}
              fullscreenAutorotate={true}
              fullscreenOrientation="landscape"
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
            />
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading video...</Text>
                <Text style={styles.loadingSubtext}>Scraped from {provider}</Text>
              </View>
            )}

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
                  <View style={styles.adFreeBadge}>
                    <Text style={styles.badgeText}>AD-FREE ✓</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  // Fallback: Use embed with ad-blocking if scraping failed (mobile only)
  if (Platform.OS === 'web') {
    // Web platform - just show message
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video player only works on mobile app</Text>
          <Text style={styles.loadingSubtext}>Please use Android/iOS app</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const videoUrl = mediaType === 'tv' 
    ? `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`
    : `https://vidsrc.to/embed/movie/${mediaId}`;

  // HTML for WebView with aggressive ad blocking (fallback only)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          background-color: #000;
          overflow: hidden;
        }
        iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        /* Hide ads */
        [id*="ad"], [class*="ad"],
        [id*="banner"], [class*="banner"],
        [id*="popup"], [class*="popup"] {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <iframe 
        src="${videoUrl}"
        allowfullscreen
        allow="autoplay; fullscreen; encrypted-media"
        referrerpolicy="origin"
      ></iframe>
      
      <script>
        window.open = function() { return null; };
        window.alert = function() {};
        
        setInterval(() => {
          document.querySelectorAll('[id*="ad"], [class*="ad"]').forEach(el => el.remove());
        }, 1000);
      </script>
    </body>
    </html>
  `;

  // Fallback WebView player
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoWrapper}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading video...</Text>
              <Text style={styles.loadingSubtext}>(Using embed fallback)</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.video}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => setError(e.nativeEvent.description)}
            mixedContentMode="always"
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url.toLowerCase();
              const adPatterns = [
                'doubleclick', 'googlesyndication', 'ads.', '/ads/',
                'popads', 'adnxs', 'advertising', 'taboola', 'outbrain'
              ];
              
              for (const pattern of adPatterns) {
                if (url.includes(pattern)) {
                  console.log("🚫 Blocked ad:", url);
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
                  onPress={scrapeVideo}
                  style={styles.retryBadge}
                >
                  <Text style={styles.badgeText}>Retry Scrape</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setError(null);
                scrapeVideo();
              }}>
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 10,
  },
  loadingText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 5,
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
  adFreeBadge: {
    backgroundColor: "#00D100",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  retryBadge: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
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
