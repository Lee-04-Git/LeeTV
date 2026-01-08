import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Platform,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { FullscreenIcon } from "../components/Icons";
import { saveWatchProgress, getWatchProgress } from "../services/supabaseService";

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

  const [videoUrl, setVideoUrl] = useState("");
  const [initialTime, setInitialTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const webViewRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  const getStorageKey = useCallback(() => {
    return mediaType === "tv"
      ? `vidrock_${mediaId}_S${season}E${episode}`
      : `vidrock_${mediaId}`;
  }, [mediaId, mediaType, season, episode]);

  const loadProgress = async () => {
    let savedTime = 0;
    try {
      const supabaseProgress = await getWatchProgress(mediaId, mediaType, season, episode);
      if (supabaseProgress?.progress_seconds > 10) {
        savedTime = supabaseProgress.progress_seconds;
        if (supabaseProgress.duration_seconds > 0) {
          const pct = (savedTime / supabaseProgress.duration_seconds) * 100;
          if (pct > 95) savedTime = 0;
        }
      }
      if (savedTime === 0) {
        const local = await AsyncStorage.getItem(getStorageKey());
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.currentTime > 10) savedTime = parsed.currentTime;
        }
      }
    } catch (e) {
      console.log("Load progress error:", e);
    }
    return savedTime;
  };

  const saveProgress = async (seconds, duration) => {
    if (!seconds || seconds < 10) return;
    if (duration > 0 && (seconds / duration) > 0.98) return;

    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify({
        currentTime: Math.floor(seconds),
        timestamp: Date.now(),
      }));
      await saveWatchProgress({
        media_id: mediaId,
        media_type: mediaType,
        title,
        poster_path: params.poster_path || null,
        backdrop_path: params.backdrop_path || null,
        season_number: mediaType === "tv" ? season : null,
        episode_number: mediaType === "tv" ? episode : null,
        episode_title: params.episodeTitle || null,
        progress_seconds: Math.floor(seconds),
        duration_seconds: Math.floor(duration) || (mediaType === "tv" ? 2400 : 7200),
      });
    } catch (e) {}
  };

  useEffect(() => {
    const init = async () => {
      const savedTime = await loadProgress();
      setInitialTime(savedTime);
      currentTimeRef.current = savedTime;

      let url = mediaType === "tv"
        ? `https://vidrock.net/tv/${mediaId}/${season}/${episode}`
        : `https://vidrock.net/movie/${mediaId}`;

      const q = ["autoplay=1", "download=false", "muted=0"];
      if (mediaType === "tv") q.push("autonext=1");
      if (savedTime > 10) q.push(`t=${Math.floor(savedTime)}`);

      setVideoUrl(url + "?" + q.join("&"));
      setIsReady(true);
    };
    init();

    if (Platform.OS !== "web") ScreenOrientation.unlockAsync();
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      saveProgress(currentTimeRef.current, durationRef.current);
      navigation.goBack();
      return true;
    });

    progressIntervalRef.current = setInterval(() => {
      saveProgress(currentTimeRef.current, durationRef.current);
    }, 10000);

    return () => {
      backHandler.remove();
      clearInterval(progressIntervalRef.current);
      saveProgress(currentTimeRef.current, durationRef.current);
      if (Platform.OS !== "web") {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible");
      }
    };
  }, []);

  const toggleOrientation = async () => {
    if (Platform.OS === "web") return;
    const o = await ScreenOrientation.getOrientationAsync();
    if (o <= 2) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  };

  const handleMessage = (e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === "progress") {
        if (data.currentTime > 0) currentTimeRef.current = data.currentTime;
        if (data.duration > 0) durationRef.current = data.duration;
      }
    } catch (err) {}
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#000;overflow:hidden}
    iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}
  </style>
</head>
<body>
  <iframe src="${videoUrl}" id="player" allowfullscreen allow="autoplay;fullscreen;encrypted-media"></iframe>
  <script>
    const resumeTime = ${initialTime};
    let resumed = false;
    let video = null;

    function findVideo(doc) {
      if (!doc) return null;
      try {
        let v = doc.querySelector('video');
        if (v) return v;
        const frames = doc.querySelectorAll('iframe');
        for (let f of frames) {
          try {
            v = findVideo(f.contentDocument || f.contentWindow.document);
            if (v) return v;
          } catch(e) {}
        }
      } catch(e) {}
      return null;
    }

    setInterval(() => {
      if (!video) {
        video = findVideo(document);
        const frame = document.getElementById('player');
        if (!video && frame) {
          try { video = findVideo(frame.contentDocument || frame.contentWindow.document); } catch(e) {}
        }
      }
      
      if (video) {
        if (!resumed && resumeTime > 10 && video.readyState >= 2) {
          video.currentTime = resumeTime;
          resumed = true;
          video.play().catch(() => {});
        }
        if (video.currentTime > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'progress',
            currentTime: Math.floor(video.currentTime),
            duration: Math.floor(video.duration || 0)
          }));
        }
      }
    }, 1500);

    window.open = () => null;
  </script>
</body>
</html>`;

  if (!isReady || !videoUrl) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* WebView takes full screen - no touch interceptors */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: "https://vidrock.net" }}
        style={styles.video}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        incognito={false}
        mixedContentMode="always"
        originWhitelist={["*"]}
        onMessage={handleMessage}
      />

      {/* Floating controls - only at top, doesn't block video */}
      <View style={styles.topControls} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => {
            saveProgress(currentTimeRef.current, durationRef.current);
            navigation.goBack();
          }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.titleBox}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {mediaType === "tv" && (
            <Text style={styles.episode}>S{season} E{episode}</Text>
          )}
        </View>
        
        <TouchableOpacity onPress={toggleOrientation} style={styles.btn}>
          <FullscreenIcon size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, backgroundColor: "#000" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16 },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  titleBox: { flex: 1, marginHorizontal: 12 },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  episode: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});

export default VideoPlayerScreen;
