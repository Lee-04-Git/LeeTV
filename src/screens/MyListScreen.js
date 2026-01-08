import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
// Removing AsyncStorage as we use Supabase now
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../constants/colors";
import {
  PlayIcon,
  StarIcon,
  DownloadIcon,
  CheckIcon,
} from "../components/Icons";
import {
  getUserList,
  removeFromList,
  getContinueWatching,
  clearAllWatchHistory,
  clearUserList,
} from "../services/supabaseService";

const { width } = Dimensions.get("window");

const getImageUrl = (posterPath) => {
  if (!posterPath) {
    return "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image";
  }

  // If it's already a full URL, return as is
  if (posterPath.startsWith("http")) {
    return posterPath;
  }

  // If it starts with /, construct TMDB URL
  if (posterPath.startsWith("/")) {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  }

  // Otherwise, assume it needs a / prefix
  return `https://image.tmdb.org/t/p/w500/${posterPath}`;
};

const MyListScreen = ({ navigation }) => {
  const [myList, setMyList] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadContinueWatching(); // Load all content
      loadList(); // Load all items
    }, [])
  );

  const loadList = async () => {
    try {
      setLoading(true);
      const list = await getUserList();
      setMyList(list);
    } catch (error) {
      console.error("Error loading list:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueWatching = async () => {
    try {
      // Load ALL continue watching (both movies and TV shows) in order of most recent
      const watching = await getContinueWatching(null);
      setContinueWatching(watching);
    } catch (error) {
      console.error("Error loading continue watching:", error);
      setContinueWatching([]);
    }
  };

  const handleClearContinueWatching = async () => {
    try {
      await clearAllWatchHistory();
      setContinueWatching([]);
    } catch (error) {
      console.error("Error clearing continue watching:", error);
    }
  };

  const handleClearMyList = async () => {
    try {
      await clearUserList();
      setMyList([]);
    } catch (error) {
      console.error("Error clearing my list:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadList(), loadContinueWatching()]);
    setRefreshing(false);
  };

  const handleRemove = async (mediaId, mediaType) => {
    try {
      await removeFromList(mediaId, mediaType);
      setMyList(
        myList.filter(
          (item) =>
            !(item.media_id === mediaId && item.media_type === mediaType)
        )
      );
    } catch (error) {
      console.error("Error removing from list:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>My List</Text>
            <Text style={styles.subtitle}>
              {myList.length} {myList.length === 1 ? "title" : "titles"} saved
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* My List Section */}
        {!loading && myList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My List</Text>
              <TouchableOpacity onPress={handleClearMyList}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {myList.map((item) => {
                const posterUrl = getImageUrl(item.poster_path);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.horizontalCard}
                    onPress={() =>
                      navigation.navigate("ShowDetails", {
                        show: {
                          id: item.media_id,
                          title: item.title,
                          name: item.title,
                          poster_path: item.poster_path,
                          backdrop_path: item.backdrop_path,
                          vote_average: item.vote_average,
                          release_date: item.release_date,
                          type: item.media_type,
                          media_type: item.media_type,
                        },
                      })
                    }
                  >
                    <Image
                      source={{ uri: posterUrl }}
                      style={styles.horizontalImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemove(item.media_id, item.media_type)}
                    >
                      <CheckIcon size={14} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.horizontalTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.vote_average && (
                      <View style={styles.ratingRow}>
                        <StarIcon size={10} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {item.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Continue Watching Section */}
        {!loading && continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Watching</Text>
              <TouchableOpacity onPress={handleClearContinueWatching}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {continueWatching.map((item, index) => {
                const posterUrl = getImageUrl(item.poster_path);
                const progressPercent = item.progress_percentage || 0;
                const uniqueKey = item.id
                  ? `cw-${item.id}`
                  : `${item.media_type}-${item.media_id}-${index}`;

                return (
                  <TouchableOpacity
                    key={uniqueKey}
                    style={styles.horizontalCard}
                    onPress={() => {
                      if (item.media_type === "tv") {
                        navigation.navigate("VideoPlayer", {
                          title: item.title,
                          mediaId: item.media_id,
                          mediaType: "tv",
                          season: item.season_number,
                          episode: item.episode_number,
                          poster_path: item.poster_path,
                          backdrop_path: item.backdrop_path,
                          episodeTitle: item.episode_title,
                        });
                      } else {
                        navigation.navigate("VideoPlayer", {
                          title: item.title,
                          mediaId: item.media_id,
                          mediaType: "movie",
                          poster_path: item.poster_path,
                          backdrop_path: item.backdrop_path,
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: posterUrl }}
                      style={styles.horizontalImage}
                      resizeMode="cover"
                    />
                    <View style={styles.playIconOverlay}>
                      <PlayIcon size={30} color={colors.white} />
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: `${Math.min(progressPercent, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.horizontalTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.media_type === "tv" && (
                      <Text style={styles.episodeText}>
                        S{item.season_number} E{item.episode_number}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {!loading && myList.length === 0 && continueWatching.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your list is empty</Text>
            <Text style={styles.emptySubtext}>
              Add movies and shows from the home screen!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: colors.lightGray,
    fontSize: 14,
    textAlign: "center",
  },
  headerGradient: {
    paddingBottom: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  backButton: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "600",
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.lightGray,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  downloadAllText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 32,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tab: {
    position: "relative",
    paddingVertical: 14,
  },
  activeTab: {
    // Active state handled by indicator
  },
  tabText: {
    color: colors.gray,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  activeTabText: {
    color: colors.white,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.netflixRed,
    borderRadius: 2,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  clearButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  horizontalCard: {
    marginRight: 12,
    width: 120,
  },
  horizontalImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  horizontalTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  episodeText: {
    color: colors.lightGray,
    fontSize: 11,
    marginTop: 2,
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    color: colors.lightGray,
    fontSize: 11,
    marginLeft: 4,
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: colors.lightGray,
    fontSize: 14,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 50,
  },
});

export default MyListScreen;
