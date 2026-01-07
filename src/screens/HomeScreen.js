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
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import {
  SearchIcon,
  BellIcon,
  UserIcon,
  StarIcon,
  PlayIcon,
} from "../components/Icons";
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTVShows,
  fetchTopRatedMovies,
  fetchTopRatedTVShows,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchAiringTodayTVShows,
  fetchOnTheAirTVShows,
  fetchMoviesByGenre,
  fetchTVShowsByGenre,
  fetchAllMovies,
  fetchAllTVShows,
  fetchAnime,
} from "../services/tmdbApi";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("Home");
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredContent, setFeaturedContent] = useState(null);
  const [featuredCarousel, setFeaturedCarousel] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  // Home tab content
  const [trendingContent, setTrendingContent] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTVShows, setPopularTVShows] = useState([]);
  const [topRatedContent, setTopRatedContent] = useState([]);
  const [animeContent, setAnimeContent] = useState([]);

  // Large datasets for search
  const [allMovies, setAllMovies] = useState([]);
  const [allTVShows, setAllTVShows] = useState([]);

  // Movies tab content
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);

  // TV Shows tab content
  const [airingTodayShows, setAiringTodayShows] = useState([]);
  const [onTheAirShows, setOnTheAirShows] = useState([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState([]);
  const [dramaShows, setDramaShows] = useState([]);
  const [comedyShows, setComedyShows] = useState([]);
  const [crimeShows, setCrimeShows] = useState([]);
  const [sciFiShows, setSciFiShows] = useState([]);
  const [animationShows, setAnimationShows] = useState([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load Home tab content
      const [trending, popMovies, popTV, topRated, anime] = await Promise.all([
        fetchTrending("week"),
        fetchPopularMovies(1),
        fetchPopularTVShows(1),
        fetchTopRatedMovies(1),
        fetchAnime(1),
      ]);

      setTrendingContent(trending);
      setPopularMovies(popMovies);
      setPopularTVShows(popTV);
      setTopRatedContent(topRated);
      setAnimeContent(anime);

      // Set up featured carousel with 4 items
      const carouselItems = trending.slice(0, 4);
      setFeaturedCarousel(carouselItems);
      setFeaturedContent(carouselItems[0] || popMovies[0]);

      // Load large datasets in background (400 movies and 400 TV shows)
      fetchAllMovies(20).then(setAllMovies);
      fetchAllTVShows(20).then(setAllTVShows);

      // Load Movies tab content
      const [
        nowPlaying,
        upcoming,
        topMovies,
        action,
        comedy,
        horror,
        romance,
        sciFi,
      ] = await Promise.all([
        fetchNowPlayingMovies(1),
        fetchUpcomingMovies(1),
        fetchTopRatedMovies(2),
        fetchMoviesByGenre(28, 1), // Action
        fetchMoviesByGenre(35, 1), // Comedy
        fetchMoviesByGenre(27, 1), // Horror
        fetchMoviesByGenre(10749, 1), // Romance
        fetchMoviesByGenre(878, 1), // Sci-Fi
      ]);

      setNowPlayingMovies(nowPlaying);
      setUpcomingMovies(upcoming);
      setTopRatedMovies(topMovies);
      setActionMovies(action);
      setComedyMovies(comedy);
      setHorrorMovies(horror);
      setRomanceMovies(romance);
      setSciFiMovies(sciFi);

      // Load TV Shows tab content
      const [
        airingToday,
        onTheAir,
        topTV,
        drama,
        comedyTV,
        crime,
        sciFiTV,
        animation,
      ] = await Promise.all([
        fetchAiringTodayTVShows(1),
        fetchOnTheAirTVShows(1),
        fetchTopRatedTVShows(2),
        fetchTVShowsByGenre(18, 1), // Drama
        fetchTVShowsByGenre(35, 1), // Comedy
        fetchTVShowsByGenre(80, 1), // Crime
        fetchTVShowsByGenre(10765, 1), // Sci-Fi & Fantasy
        fetchTVShowsByGenre(16, 1), // Animation
      ]);

      setAiringTodayShows(airingToday);
      setOnTheAirShows(onTheAir);
      setTopRatedTVShows(topTV);
      setDramaShows(drama);
      setComedyShows(comedyTV);
      setCrimeShows(crime);
      setSciFiShows(sciFiTV);
      setAnimationShows(animation);
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get categories based on selected tab
  const getContentCategories = () => {
    if (selectedTab === "Movies") {
      return [
        { title: "Now Playing", data: nowPlayingMovies },
        { title: "Upcoming", data: upcomingMovies },
        { title: "Top Rated Movies", data: topRatedMovies },
        { title: "Action Movies", data: actionMovies },
        { title: "Comedy Movies", data: comedyMovies },
        { title: "Horror Movies", data: horrorMovies },
        { title: "Romance Movies", data: romanceMovies },
        { title: "Sci-Fi Movies", data: sciFiMovies },
      ];
    } else if (selectedTab === "TV Shows") {
      return [
        { title: "Airing Today", data: airingTodayShows },
        { title: "On The Air", data: onTheAirShows },
        { title: "Top Rated TV Shows", data: topRatedTVShows },
        { title: "Drama Series", data: dramaShows },
        { title: "Comedy Series", data: comedyShows },
        { title: "Crime Shows", data: crimeShows },
        { title: "Sci-Fi & Fantasy", data: sciFiShows },
        { title: "Animation", data: animationShows },
      ];
    } else {
      // Home tab - mix of both
      return [
        { title: "Trending Now", data: trendingContent },
        { title: "Anime", data: animeContent },
        { title: "Popular Movies", data: popularMovies },
        { title: "Popular TV Shows", data: popularTVShows },
        { title: "Top Rated", data: topRatedContent },
      ];
    }
  };

  const showFeaturedSection = selectedTab === "Home";

  const handleSignOut = () => {
    setShowBrowseMenu(false);
    navigation.navigate("Auth");
  };

  const handleBrowseOption = (option) => {
    setShowBrowseMenu(false);
    if (option === "TV Shows") {
      setSelectedTab("TV Shows");
    } else if (option === "Movies") {
      setSelectedTab("Movies");
    } else if (option === "My List") {
      navigation.navigate("MyList");
    } else if (option === "Manage Profiles") {
      navigation.navigate("UserProfile");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={() => {
              // Do nothing if already on home - just reset any states if needed
              setSelectedTab("Home");
              setShowBrowseMenu(false);
            }}
          >
            <Text style={styles.logo}>LeeTV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setShowBrowseMenu(!showBrowseMenu)}
          >
            <Text style={styles.browseText}>Browse</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Search")}
          >
            <SearchIcon size={22} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("UserProfile")}
          >
            <View style={styles.profileIcon}>
              <UserIcon size={24} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Browse Dropdown Menu */}
      {showBrowseMenu && (
        <View style={styles.dropdownContainer}>
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => setShowBrowseMenu(false)}
          />
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleBrowseOption("TV Shows")}
            >
              <Text style={styles.dropdownText}>TV Shows</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleBrowseOption("Movies")}
            >
              <Text style={styles.dropdownText}>Movies</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleBrowseOption("My List")}
            >
              <Text style={styles.dropdownText}>My List</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleBrowseOption("Manage Profiles")}
            >
              <Text style={styles.dropdownText}>Manage Profiles</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleSignOut}
            >
              <Text style={[styles.dropdownText, styles.signOutText]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.netflixRed} />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        ) : (
          <>
            {/* Featured Carousel - Only show on Home */}
            {showFeaturedSection && featuredCarousel.length > 0 && (
              <>
                <View style={styles.carouselContainer}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.x / width
                      );
                      setCurrentFeaturedIndex(index);
                    }}
                    scrollEventThrottle={16}
                  >
                    {featuredCarousel.map((item, index) => (
                      <TouchableOpacity
                        key={`featured-${index}`}
                        style={styles.featuredSlide}
                        onPress={() =>
                          navigation.navigate("ShowDetails", { show: item })
                        }
                      >
                        <Image
                          source={{
                            uri: item.backdrop || item.image,
                          }}
                          style={styles.featuredImage}
                          resizeMode="cover"
                        />
                        <View style={styles.featuredOverlay}>
                          <View style={styles.featuredInfo}>
                            <Text style={styles.featuredTitle}>
                              {item.title}
                            </Text>
                            <TouchableOpacity style={styles.playButtonInline}>
                              <PlayIcon size={16} color={colors.black} />
                              <Text style={styles.playButtonText}>Play</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Carousel Dots Indicator */}
                  <View style={styles.carouselDots}>
                    {featuredCarousel.map((_, index) => (
                      <View
                        key={`dot-${index}`}
                        style={[
                          styles.dot,
                          currentFeaturedIndex === index && styles.activeDot,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Franchise Brand Cards */}
                <View style={styles.brandSection}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.brandList}
                  >
                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", {
                          franchise: "Marvel",
                        })
                      }
                    >
                      <Image
                        source={require("../../assets/marvel.png")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", {
                          franchise: "Star Wars",
                        })
                      }
                    >
                      <Image
                        source={require("../../assets/star wars.png")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", { franchise: "Anime" })
                      }
                    >
                      <Image
                        source={require("../../assets/anime.png")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", { franchise: "Hulu" })
                      }
                    >
                      <Image
                        source={require("../../assets/hulu.png")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", {
                          franchise: "Disney",
                        })
                      }
                    >
                      <Image
                        source={require("../../assets/disney+.jpg")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", { franchise: "DC" })
                      }
                    >
                      <Image
                        source={require("../../assets/dc.jpg")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", {
                          franchise: "HBO Max",
                        })
                      }
                    >
                      <Image
                        source={require("../../assets/max.jpg")}
                        style={styles.brandImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.brandCard}
                      onPress={() =>
                        navigation.navigate("Franchise", {
                          franchise: "Prime Video",
                        })
                      }
                    >
                      <Text style={styles.brandPlaceholder}>Prime Video</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </>
            )}

            {/* Dynamic Content Categories */}
            {getContentCategories().map((category, index) => {
              if (!category.data || category.data.length === 0) return null;

              return (
                <View key={`category-${index}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{category.title}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.showList}
                  >
                    {category.data.map((item) => (
                      <TouchableOpacity
                        key={`${category.title}-${item.id}`}
                        style={styles.showCard}
                        onPress={() =>
                          navigation.navigate("ShowDetails", { show: item })
                        }
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.showImage}
                          resizeMode="cover"
                        />
                        <View style={styles.showOverlay}>
                          <Text style={styles.showTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.showRatingRow}>
                            <StarIcon size={12} color="#FFD700" />
                            <Text style={styles.showRating}>{item.rating}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })}
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
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  logo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.netflixRed,
    letterSpacing: 3,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  browseText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownArrow: {
    color: colors.white,
    fontSize: 10,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  iconButton: {
    padding: 6,
  },
  profileButton: {
    position: "relative",
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: colors.netflixRed,
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    fontSize: 18,
  },
  dropdownContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1000,
  },
  dropdownOverlay: {
    position: "absolute",
    top: -60,
    left: -width,
    width: width * 2,
    height: 1000,
  },
  dropdownMenu: {
    backgroundColor: colors.cardBackground,
    borderRadius: 4,
    minWidth: 180,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dropdownText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  signOutText: {
    color: colors.lightGray,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
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
  carouselContainer: {
    width: width,
    height: width * 1.1,
    position: "relative",
    marginBottom: 10,
  },
  featuredSlide: {
    width: width,
    height: width * 1.1,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: 20,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
  },
  featuredInfo: {
    alignItems: "flex-start",
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  playButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
    gap: 6,
  },
  playButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: "bold",
  },
  carouselDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: colors.white,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandSection: {
    marginVertical: 25,
  },
  brandList: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  brandCard: {
    width: 180,
    height: 100,
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  brandImage: {
    width: "90%",
    height: "90%",
  },
  brandPlaceholder: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  showList: {
    paddingHorizontal: 20,
  },
  showCard: {
    marginRight: 10,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  showImage: {
    width: 120,
    height: 170,
    borderRadius: 6,
  },
  showOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
  },
  showTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  showRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  showRating: {
    color: colors.lightGray,
    fontSize: 11,
    fontWeight: "600",
  },
  showRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  showRating: {
    color: colors.lightGray,
    fontSize: 11,
  },
});

export default HomeScreen;
