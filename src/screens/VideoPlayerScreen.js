import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar, Platform, BackHandler, Text, AppState } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { saveVidrockProgress, getVidrockContinueWatching, getRawVidrockProgress } from "../services/vidrockService";

let WebView = null;
if (Platform.OS !== "web") WebView = require("react-native-webview").WebView;

const VideoPlayerScreen = ({ navigation, route }) => {
  const params = route.params || {};
  const mediaId = params.mediaId || params.id;
  const mediaType = params.mediaType || params.type || "movie";
  const mediaTitle = params.title || "Unknown";
  let season = 1, episode = 1;
  if (mediaType === "tv") {
    const s = parseInt(params.season, 10), e = parseInt(params.episode, 10);
    if (!isNaN(s) && s > 0) season = s;
    if (!isNaN(e) && e > 0) episode = e;
  }
  const [videoUrl, setVideoUrl] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const lastPositionRef = useRef({ currentTime: 0, duration: 0 });
  const appState = useRef(AppState.currentState);
  const saveCurrentPosition = async () => {
    try {
      const { currentTime, duration } = lastPositionRef.current;
      if (currentTime === 0 || duration === 0) return;
      const existingData = await getRawVidrockProgress();
      const updatedData = existingData.map(item => {
        if (item.id === mediaId && item.type === mediaType) {
          const updated = { ...item, last_updated: Date.now() };
          if (mediaType === "tv") {
            updated.last_season_watched = String(season);
            updated.last_episode_watched = String(episode);
            if (!updated.show_progress) updated.show_progress = {};
            updated.show_progress["s" + season + "e" + episode] = { season: String(season), episode: String(episode), progress: { watched: currentTime, duration }, last_updated: Date.now() };
          } else updated.progress = { watched: currentTime, duration };
          return updated;
        }
        return item;
      });
      const exists = updatedData.some(item => item.id === mediaId && item.type === mediaType);
      if (!exists) {
        const newItem = { id: mediaId, type: mediaType, title: mediaTitle, poster_path: params.poster_path || null, backdrop_path: params.backdrop_path || null, last_updated: Date.now() };
        if (mediaType === "tv") {
          newItem.last_season_watched = String(season);
          newItem.last_episode_watched = String(episode);
          newItem.show_progress = {};
          newItem.show_progress["s" + season + "e" + episode] = { season: String(season), episode: String(episode), progress: { watched: currentTime, duration }, last_updated: Date.now() };
        } else newItem.progress = { watched: currentTime, duration };
        updatedData.push(newItem);
      }
      await saveVidrockProgress(updatedData);
    } catch (error) {}
  };
  const handleVidrockMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "MEDIA_DATA") {
        const mediaDataArray = message.data;
        if (!Array.isArray(mediaDataArray)) return;
        const validItems = mediaDataArray.filter(item => item.id && item.type && item.title);
        if (validItems.length === 0) return;
        const existingData = await getRawVidrockProgress();
        const existingMap = new Map();
        existingData.forEach(item => existingMap.set(item.type + "-" + item.id, item));
        validItems.forEach(item => {
          const key = item.type + "-" + item.id;
          const existing = existingMap.get(key);
          if (!existing || (item.last_updated || 0) >= (existing.last_updated || 0)) {
            existingMap.set(key, item);
            if (item.id === mediaId && item.type === mediaType) {
              if (mediaType === "tv" && item.show_progress) {
                const episodeProgress = item.show_progress["s" + season + "e" + episode];
                if (episodeProgress?.progress) lastPositionRef.current = { currentTime: episodeProgress.progress.watched, duration: episodeProgress.progress.duration };
              } else if (mediaType === "movie" && item.progress) lastPositionRef.current = { currentTime: item.progress.watched, duration: item.progress.duration };
            }
          }
        });
        await saveVidrockProgress(Array.from(existingMap.values()));
      }
      if (message.type === "PLAYER_EVENT") {
        const { event: eventType, currentTime, duration } = message.data;
        if (currentTime !== undefined && duration !== undefined) lastPositionRef.current = { currentTime, duration };
        if (eventType === "pause" || eventType === "ended") await saveCurrentPosition();
      }
    } catch (error) {}
  };
  useEffect(() => {
    const init = async () => {
      const existingProgress = await getVidrockContinueWatching();
      setProgressData(existingProgress);
      let url = mediaType === "tv" ? "https://vidrock.net/tv/" + mediaId + "/" + season + "/" + episode : "https://vidrock.net/movie/" + mediaId;
      const q = ["autoplay=1", "download=false", "muted=0"];
      if (mediaType === "tv") q.push("autonext=1");
      setVideoUrl(url + "?" + q.join("&"));
      setIsReady(true);
    };
    init();
    if (Platform.OS !== "web") ScreenOrientation.unlockAsync();
    if (Platform.OS === "android") { try { NavigationBar.setVisibilityAsync("hidden"); } catch (e) {} }
    const appStateSubscription = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) saveCurrentPosition();
      appState.current = nextAppState;
    });
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => { saveCurrentPosition(); navigation.goBack(); return true; });
    return () => {
      backHandler.remove();
      appStateSubscription.remove();
      saveCurrentPosition();
      if (Platform.OS !== "web") ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (Platform.OS === "android") NavigationBar.setVisibilityAsync("visible");
    };
  }, [mediaId, season, episode]);
  const progressDataJson = JSON.stringify(progressData.map(item => ({ id: item.id, type: item.type, title: item.title, poster_path: item.poster_path, backdrop_path: item.backdrop_path, progress: item.progress || { watched: 0, duration: 0 }, last_updated: item.last_updated, number_of_episodes: item.number_of_episodes, number_of_seasons: item.number_of_seasons, last_season_watched: item.last_season_watched, last_episode_watched: item.last_episode_watched, show_progress: item.show_progress || {} })));
  const htmlContent = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no'><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}</style></head><body><iframe src='" + videoUrl + "' allowfullscreen allow='autoplay;fullscreen;encrypted-media'></iframe><script>window.open=()=>null;try{const d=" + progressDataJson + ";let e=[];try{const s=localStorage.getItem('vidRockProgress');if(s){e=JSON.parse(s);if(!Array.isArray(e))e=[]}}catch(x){e=[]}const m=new Map();e.forEach(i=>m.set(i.type+'-'+i.id,i));d.forEach(i=>{const k=i.type+'-'+i.id;const x=m.get(k);if(!x||(i.last_updated||0)>=(x.last_updated||0))m.set(k,i)});localStorage.setItem('vidRockProgress',JSON.stringify(Array.from(m.values())))}catch(x){}window.addEventListener('message',e=>{if(!e.data||typeof e.data!=='object')return;if(e.data?.type==='MEDIA_DATA'){const d=e.data.data;try{let x=[];try{const s=localStorage.getItem('vidRockProgress');if(s){x=JSON.parse(s);if(!Array.isArray(x))x=[]}}catch(y){x=[]}const m=new Map();x.forEach(i=>m.set(i.type+'-'+i.id,i));if(Array.isArray(d))d.forEach(i=>{const k=i.type+'-'+i.id;const y=m.get(k);if(!y||(i.last_updated||0)>=(y.last_updated||0))m.set(k,i)});localStorage.setItem('vidRockProgress',JSON.stringify(Array.from(m.values())))}catch(y){if(Array.isArray(d))localStorage.setItem('vidRockProgress',JSON.stringify(d))}if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'MEDIA_DATA',data:d}))}if(e.data?.type==='PLAYER_EVENT'&&window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'PLAYER_EVENT',data:e.data.data}))});</script></body></html>";
  if (!isReady || !videoUrl) return (<View style={styles.container}><StatusBar hidden /><View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View></View>);
  return (<View style={styles.container}><StatusBar hidden /><WebView source={{ html: htmlContent, baseUrl: "https://vidrock.net" }} style={styles.video} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled cacheEnabled incognito={false} mixedContentMode="always" originWhitelist={["*"]} onMessage={handleVidrockMessage} /></View>);
};
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#000" }, video: { flex: 1, backgroundColor: "#000" }, loading: { flex: 1, justifyContent: "center", alignItems: "center" }, loadingText: { color: "#fff", fontSize: 16 } });
export default VideoPlayerScreen;
