import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import { useMyList } from "../context/MyListContext";
import {
  PlusIcon,
  CheckIcon,
  StarIcon,
  PlayIcon,
  DownloadIcon,
} from "../components/Icons";
import {
  fetchMovieDetails,
  fetchTVShowDetails,
  fetchSeasonDetails,
  fetchSimilarMovies,
  fetchRecommendedMovies,
  fetchSimilarTVShows,
  fetchRecommendedTVShows,
} from "../services/tmdbApi";

const { width } = Dimensions.get("window");

const ShowDetailsScreen = ({ navigation, route }) => {
  const { show: initialShow } = route.params || {};
  const { myList, addToList, removeFromList, isInList } = useMyList();
  const [show, setShow] = useState(initialShow);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const inList = isInList(show?.id);

  useEffect(() => {
    loadDetails();
  }, [initialShow?.id]);

  useEffect(() => {
    if (show?.type === "tv" && show?.id) {
      loadSeasonDetails(selectedSeason);
    }
  }, [selectedSeason, show?.id]);

  useEffect(() => {
    if (show?.id && show?.type) {
      loadRelatedContent();
    }
  }, [show?.id, show?.type]);

  const loadDetails = async () => {
    if (!initialShow?.id) return;

    try {
      setLoading(true);
      let details;

      if (initialShow.type === "movie") {
        details = await fetchMovieDetails(initialShow.id);
      } else if (initialShow.type === "tv") {
        details = await fetchTVShowDetails(initialShow.id);
      }

      if (details) {
        setShow(details);
        if (details.type === "tv" && details.seasons?.length > 0) {
          const firstRealSeason = details.seasons.find(
            (s) => s.seasonNumber > 0
          );
          if (firstRealSeason) {
            setSelectedSeason(firstRealSeason.seasonNumber);
          }
        }
      }
    } catch (error) {
      console.error("Error loading details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonDetails = async (seasonNumber) => {
    if (!show?.id || show?.type !== "tv") return;

    try {
      setLoadingEpisodes(true);
      const details = await fetchSeasonDetails(show.id, seasonNumber);
      setSeasonDetails(details);
    } catch (error) {
      console.error("Error loading season details:", error);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const loadRelatedContent = async () => {
    if (!show?.id || !show?.type) return;

    try {
      setLoadingRelated(true);
      let similarContent = [];
      let recommendedContent = [];

      if (show.type === "movie") {
        // Fetch both similar and recommended movies
        const [similar, recommended] = await Promise.all([
          fetchSimilarMovies(show.id),
          fetchRecommendedMovies(show.id),
        ]);
        similarContent = similar;
        recommendedContent = recommended;
      } else if (show.type === "tv") {
        // Fetch both similar and recommended TV shows
        const [similar, recommended] = await Promise.all([
          fetchSimilarTVShows(show.id),
          fetchRecommendedTVShows(show.id),
        ]);
        similarContent = similar;
        recommendedContent = recommended;
      }

      // Combine and deduplicate results
      const combined = [...similarContent, ...recommendedContent];
      const uniqueMap = new Map();
      combined.forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      const uniqueResults = Array.from(uniqueMap.values()).slice(0, 12);
      setRelatedContent(uniqueResults);
    } catch (error) {
      console.error("Error loading related content:", error);
    } finally {
      setLoadingRelated(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.logo}>LeeTV</Text>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.netflixRed} />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : (
          <>
            {/* Featured Image/Banner */}
            <View style={styles.bannerContainer}>
              <Image
                source={{ uri: show?.backdrop || show?.image }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.5)", colors.background]}
                style={styles.bannerGradient}
              />
            </View>

            {/* Show Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{show?.title}</Text>

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.playButtonMain}
                  onPress={() => {
                    if (show?.type === "movie") {
                      navigation.navigate("VideoPlayer", {
                        title: show?.title,
                        mediaId: show?.id,
                        mediaType: "movie",
                      });
                    } else if (
                      show?.type === "tv" &&
                      seasonDetails?.episodes?.length > 0
                    ) {
                      const firstEpisode = seasonDetails.episodes[0];
                      navigation.navigate("VideoPlayer", {
                        title: show?.title,
                        mediaId: show?.id,
                        mediaType: "tv",
                        season: selectedSeason,
                        episode: firstEpisode.episode_number,
                      });
                    }
                  }}
                >
                  <PlayIcon size={24} color={colors.black} />
                  <Text style={styles.playButtonMainText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.myListButton}
                  onPress={() => {
                    if (inList) {
                      removeFromList(show?.id);
                    } else {
                      addToList(show);
                    }
                  }}
                >
                  {inList ? (
                    <CheckIcon size={24} color={colors.white} />
                  ) : (
                    <PlusIcon size={24} color={colors.white} />
                  )}
                  <Text style={styles.myListButtonText}>
                    {inList ? "In My List" : "My List"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Meta Information */}
              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <StarIcon size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{show?.rating}</Text>
                </View>
                <Text style={styles.metaText}>{show?.year}</Text>
                {show?.type === "movie" && show?.runtime && (
                  <Text style={styles.metaText}>{show.runtime}</Text>
                )}
                {show?.type === "tv" && (
                  <Text style={styles.metaText}>
                    {show?.numberOfSeasons} Season
                    {show?.numberOfSeasons !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              {/* Genres */}
              {show?.genres && show.genres.length > 0 && (
                <View style={styles.genresRow}>
                  {show.genres.slice(0, 3).map((genre, index) => (
                    <View key={index} style={styles.genreBadge}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Description */}
              <Text style={styles.description}>{show?.overview}</Text>

              {/* Cast */}
              {show?.cast && show.cast.length > 0 && (
                <View style={styles.castSection}>
                  <Text style={styles.sectionTitle}>Cast</Text>
                  <Text style={styles.castText}>
                    {show.cast
                      .slice(0, 5)
                      .map((c) => c.name)
                      .join(", ")}
                  </Text>
                </View>
              )}

              {/* Creator/Director */}
              {show?.type === "tv" && show?.creator && (
                <Text style={styles.creatorText}>Creator: {show.creator}</Text>
              )}
              {show?.type === "movie" && show?.director && (
                <Text style={styles.creatorText}>
                  Director: {show.director}
                </Text>
              )}

              {/* TV Show Seasons & Episodes */}
              {show?.type === "tv" &&
                show?.seasons &&
                show.seasons.length > 0 && (
                  <>
                    {/* Season Selector */}
                    <View style={styles.seasonContainer}>
                      <TouchableOpacity
                        style={styles.seasonButton}
                        onPress={() =>
                          setShowSeasonDropdown(!showSeasonDropdown)
                        }
                      >
                        <Text style={styles.seasonText}>
                          Season {selectedSeason}
                        </Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>

                      {showSeasonDropdown && (
                        <View style={styles.seasonDropdown}>
                          {show.seasons
                            .filter((s) => s.seasonNumber > 0)
                            .map((season) => (
                              <TouchableOpacity
                                key={season.id}
                                style={[
                                  styles.seasonOption,
                                  selectedSeason === season.seasonNumber &&
                                    styles.selectedSeasonOption,
                                ]}
                                onPress={() => {
                                  setSelectedSeason(season.seasonNumber);
                                  setShowSeasonDropdown(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.seasonOptionText,
                                    selectedSeason === season.seasonNumber &&
                                      styles.selectedSeasonText,
                                  ]}
                                >
                                  {season.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}
                    </View>

                    {/* Episodes List */}
                    {loadingEpisodes ? (
                      <View style={styles.episodesLoadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={colors.netflixRed}
                        />
                        <Text style={styles.episodesLoadingText}>
                          Loading episodes...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.episodesContainer}>
                        {seasonDetails?.episodes?.map((episode) => (
                          <TouchableOpacity
                            key={episode.id}
                            style={styles.episodeCard}
                            onPress={() => {
                              navigation.navigate("VideoPlayer", {
                                title: show?.title,
                                mediaId: show?.id,
                                mediaType: "tv",
                                season: selectedSeason,
                                episode: episode.episode_number,
                              });
                            }}
                          >
                            <Image
                              source={{ uri: episode.stillPath }}
                              style={styles.episodeThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.episodeInfo}>
                              <View style={styles.episodeHeader}>
                                <Text style={styles.episodeNumber}>
                                  {episode.episodeNumber}. {episode.name}
                                </Text>
                                <Text style={styles.episodeDuration}>
                                  {episode.runtime}
                                </Text>
                              </View>
                              <Text
                                style={styles.episodeDescription}
                                numberOfLines={2}
                              >
                                {episode.overview ||
                                  "No description available."}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.episodePlayButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                navigation.navigate("VideoPlayer", {
                                  title: show?.title,
                                  mediaId: show?.id,
                                  mediaType: "tv",
                                  season: selectedSeason,
                                  episode: episode.episode_number,
                                });
                              }}
                            >
                              <PlayIcon size={20} color={colors.white} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

              {/* More Like This Section */}
              {relatedContent.length > 0 && (
                <View style={styles.moreLikeThisSection}>
                  <Text style={styles.moreLikeThisTitle}>More Like This</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedList}
                  >
                    {relatedContent.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.relatedCard}
                        onPress={() => {
                          navigation.push("ShowDetails", { show: item });
                        }}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.relatedImage}
                          resizeMode="cover"
                        />
                        <View style={styles.relatedOverlay}>
                          <Text style={styles.relatedTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.relatedRating}>
                            <StarIcon size={10} color="#FFD700" />
                            <Text style={styles.relatedRatingText}>
                              {item.rating}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor:
      "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.netflixRed,
    letterSpacing: 3,
    textShadow: "0px 2px 8px rgba(0, 0, 0, 0.6)",
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    width: width,
    height: width * 0.6,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginTop: -60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 20,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  playButtonMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 8,
  },
  playButtonMainText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "bold",
  },
  myListButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 8,
  },
  myListButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 18,
    gap: 6,
  },
  description: {
    color: colors.lightGray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  seasonContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  seasonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  seasonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownIcon: {
    color: colors.white,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 5,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  metaText: {
    color: colors.lightGray,
    fontSize: 15,
    fontWeight: "500",
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  genreBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  genreText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  castSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },
  castText: {
    color: colors.lightGray,
    fontSize: 14,
    lineHeight: 22,
  },
  creatorText: {
    color: colors.lightGray,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  seasonDropdown: {
    backgroundColor: colors.cardBackground,
    marginTop: 8,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  seasonOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  selectedSeasonOption: {
    backgroundColor: "rgba(229, 9, 20, 0.2)",
  },
  seasonOptionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  selectedSeasonText: {
    color: colors.netflixRed,
    fontWeight: "bold",
  },
  episodesLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 12,
  },
  episodesLoadingText: {
    color: colors.lightGray,
    fontSize: 14,
    fontWeight: "600",
  },
  episodesContainer: {
    marginTop: 10,
    gap: 16,
  },
  episodeCard: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    overflow: "hidden",
  },
  episodeThumbnail: {
    width: 150,
    height: 85,
  },
  episodeInfo: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  episodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  episodeNumber: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    paddingRight: 8,
  },
  episodeDuration: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "600",
  },
  episodeDescription: {
    color: colors.lightGray,
    fontSize: 13,
    lineHeight: 18,
  },
  episodePlayButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  episodeTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  downloadButton: {
    padding: 5,
  },
  moreLikeThisSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  moreLikeThisTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  relatedList: {
    paddingRight: 20,
  },
  relatedCard: {
    marginRight: 10,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  relatedImage: {
    width: 110,
    height: 150,
    borderRadius: 6,
  },
  relatedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    padding: 8,
  },
  relatedTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  relatedRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relatedRatingText: {
    color: colors.lightGray,
    fontSize: 11,
    fontWeight: "600",
  },
});

export default ShowDetailsScreen;
