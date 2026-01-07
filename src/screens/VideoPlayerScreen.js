import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { WebView } from "react-native-webview";
import Video from "react-native-video";
import colors from "../constants/colors";

const { width, height } = Dimensions.get("window");

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
  const [extractedVideoUrl, setExtractedVideoUrl] = useState(null);
  const [useNativePlayer, setUseNativePlayer] = useState(false);
  const webViewRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  useEffect(() => {
    console.log("VideoPlayer params:", { title, mediaId, mediaType, season, episode });
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    
    return () => backHandler.remove();
  }, []);

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);
      
      if (data.type === "VIDEO_URL") {
        console.log("Extracted video URL:", data.url);
        setExtractedVideoUrl(data.url);
        setUseNativePlayer(true);
        setLoading(false);
      } else if (data.type === "AD_BLOCKED") {
        console.log("Ad blocked:", data.url);
      } else if (data.type === "CONSOLE") {
        console.log("WebView console:", data.message);
      }
    } catch (e) {
      console.log("Message parse error:", e);
    }
  };

  // Build embed URL - using vidrock.net
  const getVideoUrl = () => {
    if (!mediaId) return null;
    const id = String(mediaId);
    if (mediaType === "tv") {
      return `https://vidrock.net/tv/${id}/${season}/${episode}`;
    }
    return `https://vidrock.net/movie/${id}`;
  };

  const videoUrl = getVideoUrl();

  useEffect(() => {
    if (videoUrl) console.log("Video URL:", videoUrl);
  }, [videoUrl]);

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

  if (!videoUrl || !mediaId) {
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

  // HTML for WebView embed player with aggressive extraction
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
      <meta name="referrer" content="no-referrer">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{width:100%;height:100%;background-color:#000;overflow:hidden}
        #container{width:100%;height:100%;position:relative}
        /* Hide ad containers */
        [id*="ad-"], [class*="ad-"], [id*="ads"], [class*="ads"],
        [id*="banner"], [class*="banner"], [id*="popup"], [class*="popup"] {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div id="container"></div>
      
      <script>
        (function() {
          // Block popups
          window.open = function() { return null; };
          window.alert = function() {};
          window.confirm = function() { return false; };
          
          let extractedUrl = null;
          let foundVideo = false;
          
          // Intercept ALL network requests before they happen
          const originalXHROpen = XMLHttpRequest.prototype.open;
          const originalXHRSend = XMLHttpRequest.prototype.send;
          
          XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url;
            return originalXHROpen.apply(this, arguments);
          };
          
          XMLHttpRequest.prototype.send = function() {
            const url = this._url;
            if (url && (url.includes('.m3u8') || url.includes('.mp4') || url.includes('playlist') || url.includes('master'))) {
              if (!foundVideo) {
                foundVideo = true;
                console.log('🎥 XHR Video found:', url);
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'VIDEO_URL',
                  url: url,
                  method: 'XHR'
                }));
              }
            }
            return originalXHRSend.apply(this, arguments);
          };
          
          // Intercept Fetch
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            const urlString = typeof url === 'string' ? url : url?.url || url?.href || String(url);
            
            if (urlString && (urlString.includes('.m3u8') || urlString.includes('.mp4') || urlString.includes('playlist') || urlString.includes('master'))) {
              if (!foundVideo) {
                foundVideo = true;
                console.log('🎥 Fetch Video found:', urlString);
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'VIDEO_URL',
                  url: urlString,
                  method: 'Fetch'
                }));
              }
            }
            
            return originalFetch.apply(this, arguments);
          };
          
          // Monitor for video/source elements
          const checkForVideo = () => {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              if (video.src && !foundVideo) {
                foundVideo = true;
                console.log('🎥 Video element src:', video.src);
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'VIDEO_URL',
                  url: video.src,
                  method: 'VideoElement'
                }));
              }
              
              const sources = video.querySelectorAll('source');
              sources.forEach(source => {
                if (source.src && !foundVideo) {
                  foundVideo = true;
                  console.log('🎥 Source element:', source.src);
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'VIDEO_URL',
                    url: source.src,
                    method: 'SourceElement'
                  }));
                }
              });
            });
          };
          
          // Watch for new elements
          const observer = new MutationObserver(checkForVideo);
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
          });
          
          // Periodic checks
          setInterval(checkForVideo, 500);
          setTimeout(checkForVideo, 1000);
          setTimeout(checkForVideo, 2000);
          setTimeout(checkForVideo, 3000);
          
          // Load the embed page
          const container = document.getElementById('container');
          const iframe = document.createElement('iframe');
          iframe.src = '${videoUrl}';
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.allowFullscreen = true;
          iframe.allow = 'autoplay; fullscreen; encrypted-media';
          container.appendChild(iframe);
          
          console.log('🚀 Video extraction initialized');
        })();
      </script>
    </body>
    </html>
  `;

  // Web platform - use iframe
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}{mediaType === "tv" ? ` S${season}E${episode}` : ""}
          </Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.videoContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          <iframe
            src={videoUrl}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        </View>
      </View>
    );
  }

  // If we have extracted video URL, use native player (react-native-video with ExoPlayer)
  if (useNativePlayer && extractedVideoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        
        <TouchableWithoutFeedback onPress={toggleControls}>
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: extractedVideoUrl }}
              style={styles.video}
              controls={true}
              resizeMode="contain"
              repeat={false}
              paused={false}
              onLoad={() => {
                setLoading(false);
                console.log("ExoPlayer loaded successfully");
              }}
              onError={(error) => {
                console.error("ExoPlayer error:", error);
                setError(error);
                setUseNativePlayer(false); // Fallback to WebView
              }}
              onBuffer={({ isBuffering }) => {
                if (isBuffering) {
                  console.log("Buffering...");
                }
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
                <Text style={styles.loadingText}>Loading ExoPlayer...</Text>
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
                  <View style={styles.nativePlayerBadge}>
                    <Text style={styles.badgeText}>ExoPlayer</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  // Native platform (iOS/Android) - use WebView with extraction attempts
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoWrapper}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Loading video...{'\n'}
                <Text style={styles.loadingSubtext}>Attempting to extract stream</Text>
              </Text>
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
            onLoadEnd={() => {
              setLoading(false);
              console.log("WebView loaded");
            }}
            onMessage={handleWebViewMessage}
            onError={(e) => {
              console.log("WebView error:", e.nativeEvent);
              setError(e.nativeEvent.description);
            }}
            onHttpError={(e) => console.log("HTTP error:", e.nativeEvent)}
            mixedContentMode="always"
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={["*"]}
            userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            cacheEnabled={true}
            incognito={false}
            injectedJavaScript={`
              // Additional injection after page load
              setTimeout(() => {
                console.log('Injected script running...');
                const videos = document.querySelectorAll('video');
                console.log('Found ' + videos.length + ' video elements');
                videos.forEach((v, i) => {
                  console.log('Video ' + i + ' src:', v.src || 'no src');
                });
              }, 3000);
              true;
            `}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url.toLowerCase();
              
              // Block ad URLs
              if (
                url.includes("doubleclick") ||
                url.includes("googlesyndication") ||
                url.includes("adservice") ||
                url.includes("ads.") ||
                url.includes("/ads/") ||
                url.includes("popads") ||
                url.includes("popunder") ||
                url.includes("adnxs") ||
                url.includes("advertising") ||
                url.includes("taboola") ||
                url.includes("outbrain")
              ) {
                console.log("Blocked ad URL:", url);
                return false;
              }
              
              return true;
            }}
          />

          {/* Back Button Overlay */}
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
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Failed to load video</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setError(null);
                setLoading(true);
                webViewRef.current?.reload();
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  headerButton: {
    width: 70,
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  videoContainer: {
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
  nativePlayerBadge: {
    backgroundColor: "#00D100",
    paddingHorizontal: 10,
    paddingVertical: 4,
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
