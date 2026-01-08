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
  const [selectedTab, setSelectedTab] = useState("Movies");
  const [myList, setMyList] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadList();
      loadContinueWatching();
    }, [selectedTab])
  );

  const loadList = async () => {
    try {
      setLoading(true);
      const list = await getUserList();
      console.log("========== MY LIST DATA ==========");
      console.log("Total items loaded:", list.length);
      list.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          title: item.title,
          media_type: item.media_type,
          poster_path: item.poster_path,
          media_id: item.media_id,
        });
      });
      console.log("==================================");
      setMyList(list);
    } catch (error) {
      console.error("Error loading list:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueWatching = async () => {
    try {
      // Filter by media type based on selected tab
      const mediaType = selectedTab === "Movies" ? "movie" : "tv";

      // Load from Supabase (cloud database)
      const watching = await getContinueWatching(mediaType);

      console.log(
        `Loaded ${watching.length} continue watching items from Supabase for ${mediaType}`
      );
      setContinueWatching(watching);
    } catch (error) {
      console.error("Error loading continue watching:", error);
      setContinueWatching([]);
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

  // Filter content by selected tab
  const displayedContent = myList.filter((item) =>
    selectedTab === "Movies"
      ? item.media_type === "movie"
      : item.media_type === "tv"
  );

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
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.95)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0)",
          ]}
          style={styles.headerGradient}
        >
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

          {/* Premium Tab System */}
          <View style={styles.tabContainer}>
            {["Movies", "TV Shows"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
                {selectedTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Continue Watching Section */}
        {!loading && continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Watching</Text>
              <Text style={styles.sectionCount}>{continueWatching.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {continueWatching.map((item, index) => {
                const posterUrl = getImageUrl(item.poster_path);
                const progressPercent = item.progress_percentage || 0;

                // Use Supabase row ID for truly unique key, fallback to media info + index
                const uniqueKey = item.id
                  ? `cw-${item.id}`
                  : item.media_type === "tv"
                  ? `tv-${item.media_id}-s${item.season_number}-e${item.episode_number}-${index}`
                  : `movie-${item.media_id}-${index}`;

                return (
                  <TouchableOpacity
                    key={uniqueKey}
                    style={styles.continueCard}
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
                          // Pass saved progress directly to skip Supabase query
                          savedProgress: item.progress_seconds,
                          savedDuration: item.duration_seconds,
                        });
                      } else {
                        navigation.navigate("VideoPlayer", {
                          title: item.title,
                          mediaId: item.media_id,
                          mediaType: "movie",
                          poster_path: item.poster_path,
                          backdrop_path: item.backdrop_path,
                          // Pass saved progress directly to skip Supabase query
                          savedProgress: item.progress_seconds,
                          savedDuration: item.duration_seconds,
                        });
                      }
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={styles.continueImageContainer}>
                      <Image
                        source={{ uri: posterUrl }}
                        style={styles.continueImage}
                        resizeMode="cover"
                      />

                      {/* Dark overlay with gradient */}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.75)"]}
                        style={styles.continueGradientOverlay}
                      >
                        <View style={styles.episodeOverlayInfo}>
                          {item.media_type === "tv" && (
                            <Text style={styles.episodeNumber}>
                              S{item.season_number} E{item.episode_number}
                            </Text>
                          )}
                        </View>
                      </LinearGradient>

                      {/* Play Button Overlay */}
                      <View style={styles.continueOverlay}>
                        <View style={styles.playButtonCircle}>
                          <PlayIcon size={26} color={colors.black} />
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.min(progressPercent, 100)}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.continueInfo}>
                      <Text style={styles.continueTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.media_type === "tv" && item.episode_title && (
                        <Text style={styles.continueEpisode} numberOfLines={1}>
                          {item.episode_title}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {!loading &&
          displayedContent.length === 0 &&
          continueWatching.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedTab.toLowerCase()} in your list yet
              </Text>
              <Text style={styles.emptySubtext}>
                Add some from the home screen!
              </Text>
            </View>
          )}

        {/* My List Grid Section */}
        {!loading && displayedContent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                My {selectedTab === "Movies" ? "Movies" : "TV Shows"}
              </Text>
              <Text style={styles.sectionCount}>{displayedContent.length}</Text>
            </View>

            {displayedContent.length === 0 ? (
              <View style={styles.emptySection}>
                <View style={styles.emptyIconContainer}>
                  <CheckIcon size={44} color={colors.gray} />
                </View>
                <Text style={styles.emptyText}>
                  No {selectedTab === "Movies" ? "movies" : "shows"} yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Start adding {selectedTab === "Movies" ? "movies" : "shows"}{" "}
                  to build your collection
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {displayedContent.map((item) => {
                  const posterUrl = getImageUrl(item.poster_path);

                  console.log(
                    "Item:",
                    item.title,
                    "poster_path:",
                    item.poster_path,
                    "Full URL:",
                    posterUrl
                  );

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
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
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{ uri: posterUrl }}
                          style={styles.image}
                          resizeMode="cover"
                          onError={(e) =>
                            console.log(
                              "Image load error:",
                              e.nativeEvent.error
                            )
                          }
                          onLoad={() => console.log("Image loaded:", posterUrl)}
                        />

                        {/* Gradient Overlay on Image */}
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.9)"]}
                          style={styles.cardGradientOverlay}
                        >
                          <View style={styles.cardBottomInfo}>
                            {item.vote_average && (
                              <View style={styles.ratingBadge}>
                                <StarIcon size={11} color="#FFD700" />
                                <Text style={styles.ratingBadgeText}>
                                  {item.vote_average.toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </LinearGradient>

                        {/* Hover Play Button */}
                        <View style={styles.cardOverlay}>
                          <View style={styles.playButtonSmall}>
                            <PlayIcon size={22} color={colors.black} />
                          </View>
                        </View>

                        {/* Top Badge - Remove from List */}
                        <TouchableOpacity
                          style={styles.topBadgeContainer}
                          onPress={() =>
                            handleRemove(item.media_id, item.media_type)
                          }
                        >
                          <View style={styles.inListBadge}>
                            <CheckIcon size={11} color={colors.white} />
                          </View>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardInfo}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
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
    marginTop: 34,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  sectionCount: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    letterSpacing: 0.3,
  },
  horizontalList: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  continueCard: {
    marginRight: 18,
    borderRadius: 10,
    overflow: "hidden",
    width: 360,
    backgroundColor: colors.cardBackground,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  continueImageContainer: {
    position: "relative",
  },
  continueImage: {
    width: 360,
    height: 200,
  },
  continueGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  episodeOverlayInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  episodeNumber: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  continueOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  progressBar: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 0,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.netflixRed,
    borderRadius: 0,
  },
  continueInfo: {
    padding: 16,
  },
  continueTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  continueEpisode: {
    color: colors.lightGray,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 70,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  emptySubtext: {
    color: colors.lightGray,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 5,
  },
  card: {
    width: width > 600 ? "23%" : "31%",
    marginHorizontal: width > 600 ? "1%" : "1.16%",
    marginBottom: 32,
  },
  cardImageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.cardBackground,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  image: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: colors.cardBackground,
  },
  cardGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  cardBottomInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  playButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  topBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  inListBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(70, 211, 105, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  itemTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingText: {
    color: colors.lightGray,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default MyListScreen;
