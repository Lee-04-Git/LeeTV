import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";

const { width, height } = Dimensions.get("window");

const VideoPlayerScreen = ({ navigation, route }) => {
  const { title, mediaId, mediaType, season, episode } = route.params || {};
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  // Log parameters for debugging
  useEffect(() => {
    console.log("VideoPlayer params:", {
      title,
      mediaId,
      mediaType,
      season,
      episode,
    });
  }, []);

  // Build VidRock URL (vidbinge.dev or vidsrc.to are alternatives)
  const getVideoUrl = () => {
    if (!mediaId || !mediaType) {
      console.error("Missing required parameters: mediaId or mediaType");
      return null;
    }

    if (mediaType === "tv") {
      if (!season || !episode) {
        console.error("Missing season or episode for TV show");
        return null;
      }
      // VidSrc for TV: https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}
      return `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`;
    } else if (mediaType === "movie") {
      // VidSrc for Movies: https://vidsrc.to/embed/movie/{tmdb_id}
      return `https://vidsrc.to/embed/movie/${mediaId}`;
    }
    return null;
  };

  const videoUrl = getVideoUrl();

  useEffect(() => {
    if (videoUrl) {
      console.log("Video URL:", videoUrl);
    }
  }, [videoUrl]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (!videoUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load video. Invalid parameters.
          </Text>
          <Text style={styles.errorDetails}>
            mediaId: {mediaId || "missing"}
            {"\n"}
            mediaType: {mediaType || "missing"}
            {mediaType === "tv" &&
              `\nseason: ${season || "missing"}\nepisode: ${
                episode || "missing"
              }`}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar hidden />

      {/* Header with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || "Playing Video"}
          {mediaType === "tv" && season && episode
            ? ` S${season}E${episode}`
            : ""}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: videoUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error: ", nativeEvent);
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView HTTP error: ", nativeEvent);
          }}
          mixedContentMode="compatibility"
          allowFileAccess
          cacheEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  headerButton: {
    width: 70,
  },
  headerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    zIndex: 1,
  },
  loadingText: {
    color: colors.white,
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: colors.white,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  errorDetails: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default VideoPlayerScreen;
