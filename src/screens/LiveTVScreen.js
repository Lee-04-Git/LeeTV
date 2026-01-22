import { useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";

const CHANNELS = [
  {
    id: "espn-1-mx",
    name: "ESPN 1 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_1_mx_dda19148.m3u8",
  },
  {
    id: "espn-2-mx",
    name: "ESPN 2 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_2_mx_6411fcbb.m3u8",
  },
  {
    id: "espn-3-mx",
    name: "ESPN 3 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_3_mx_35976a9f.m3u8",
  },
  {
    id: "fox-sports-1-mx",
    name: "FOX SPORTS 1 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Fox_Sports_logo.svg/1200px-Fox_Sports_logo.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/fox_sports_1_mx_5b34aedc.m3u8",
  },
  {
    id: "fox-sports-2-mx",
    name: "FOX SPORTS 2 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Fox_Sports_logo.svg/1200px-Fox_Sports_logo.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/fox_sports_2_mx_cc570bd7.m3u8",
  },
  {
    id: "fox-sports-3-mx",
    name: "FOX SPORTS 3 MX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Fox_Sports_logo.svg/1200px-Fox_Sports_logo.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/fox_sports_3_mx_b0fcedb0.m3u8",
  },
  {
    id: "win-sports",
    name: "WIN SPORTS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Win_Sports_logo.svg/1200px-Win_Sports_logo.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/win_sports_1f15aab7.m3u8",
  },
  {
    id: "espn-sur",
    name: "ESPN SUR",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_sur_fd06b3e7.m3u8",
  },
  {
    id: "espn-2-sur",
    name: "ESPN 2 SUR",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_2_sur_54ee3327.m3u8",
  },
  {
    id: "espn-3-sur",
    name: "ESPN 3 SUR",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_3_sur_2b8b942a.m3u8",
  },
  {
    id: "claro-sports",
    name: "CLARO SPORTS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Claro_Sports_logo.svg/1200px-Claro_Sports_logo.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/claro_sports_67fc9503.m3u8",
  },
  {
    id: "espn-3-hd",
    name: "ESPN 3 HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_3_hd_b721a3a1.m3u8",
  },
  {
    id: "espn-6-hd",
    name: "ESPN 6 HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/espn_6_hd_58322cc0.m3u8",
  },
  {
    id: "futbol-network",
    name: "FUTBOL NETWORK",
    logo: "https://buddytv.netlify.app/img/no-logo.png",
    group: "Sports",
    streamUrl: "https://bugsfreeweb.github.io/LiveTVCollector/BugsfreeStreams/StreamsTV-BR/futbol_network_134a9b29.m3u8",
  },
];

const LiveTVScreen = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const player = useVideoPlayer(selectedChannel?.streamUrl || "", (player) => {
    player.loop = false;
    player.play();
  });

  const categories = ["All", "Sports"];

  const filteredChannels = selectedCategory === "All" 
    ? CHANNELS 
    : CHANNELS.filter(ch => ch.group === selectedCategory);

  const handleChannelPress = async (channel) => {
    setSelectedChannel(channel);
    setError(null);
  };

  const handleClosePlayer = async () => {
    if (player) {
      player.pause();
    }
    setSelectedChannel(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live TV</Text>
          <Text style={styles.headerSubtitle}>{CHANNELS.length} channels available</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.channelsGrid}>
            {filteredChannels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={styles.channelCard}
                onPress={() => handleChannelPress(channel)}
                activeOpacity={0.8}
              >
                <View style={styles.channelLogoContainer}>
                  <Image source={{ uri: channel.logo }} style={styles.channelLogo} resizeMode="contain" />
                </View>
                <View style={styles.channelInfo}>
                  <Text style={styles.channelName}>{channel.name}</Text>
                  <View style={styles.channelMeta}>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <Text style={styles.channelGroup}>{channel.group}</Text>
                  </View>
                </View>
                <Ionicons name="play-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {selectedChannel && (
          <View style={styles.playerOverlay}>
            <View style={styles.playerContainer}>
              <View style={styles.playerHeader}>
                <View style={styles.playerHeaderLeft}>
                  <Image source={{ uri: selectedChannel.logo }} style={styles.playerLogo} resizeMode="contain" />
                  <View>
                    <Text style={styles.playerChannelName}>{selectedChannel.name}</Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClosePlayer} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <VideoView
                style={styles.video}
                player={player}
                allowsPictureInPicture
                nativeControls
              />

              {error && (
                <View style={styles.errorOverlay}>
                  <Ionicons name="alert-circle" size={48} color="#ff0000" />
                  <Text style={styles.errorText}>Unable to load stream</Text>
                  <Text style={styles.errorSubtext}>{typeof error === 'string' ? error : 'Please check your internet connection'}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => handleChannelPress(selectedChannel)}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(55, 209, 228, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(55, 209, 228, 0.3)",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  channelsGrid: {
    padding: 16,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(55, 209, 228, 0.1)",
  },
  channelLogoContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  channelLogo: {
    width: 50,
    height: 50,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  channelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff0000",
  },
  liveText: {
    color: "#ff0000",
    fontSize: 10,
    fontWeight: "700",
  },
  channelGroup: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  playerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    width: "100%",
    height: "100%",
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  playerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerLogo: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 6,
  },
  playerChannelName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  video: {
    flex: 1,
    backgroundColor: "#000",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  errorSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default LiveTVScreen;
