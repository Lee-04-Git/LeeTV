import React, { useState, useEffect, useCallback, memo, useRef } from "react";
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
  FlatList,
  Animated,
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
  fetchAnime,
} from "../services/tmdbApi";
import { SkeletonRow, SkeletonFeatured } from "../components/SkeletonLoader";
import { getUserProfile } from "../services/supabaseService";

const { width } = Dimensions.get("window");

// --- Configuration for Tabs and Sections ---

const SECTIONS_CONFIG = {
  Home: [
    {
      title: "Trending Now",
      fn: fetchTrending,
      params: ["week"],
      id: "trending",
    },
    { title: "Anime", fn: fetchAnime, params: [1], id: "anime" },
    {
      title: "Popular Movies",
      fn: fetchPopularMovies,
      params: [1],
      id: "pop_movies",
    },
    {
      title: "Popular TV Shows",
      fn: fetchPopularTVShows,
      params: [1],
      id: "pop_tv",
    },
    {
      title: "Top Rated",
      fn: fetchTopRatedMovies,
      params: [1],
      id: "top_rated",
    },
  ],
  Movies: [
    {
      title: "Now Playing",
      fn: fetchNowPlayingMovies,
      params: [1],
      id: "now_playing",
    },
    { title: "Upcoming", fn: fetchUpcomingMovies, params: [1], id: "upcoming" },
    {
      title: "Top Rated Movies",
      fn: fetchTopRatedMovies,
      params: [2],
      id: "top_rated_movies",
    },
    {
      title: "Action Movies",
      fn: fetchMoviesByGenre,
      params: [28, 1],
      id: "action",
    },
    {
      title: "Comedy Movies",
      fn: fetchMoviesByGenre,
      params: [35, 1],
      id: "comedy",
    },
    {
      title: "Horror Movies",
      fn: fetchMoviesByGenre,
      params: [27, 1],
      id: "horror",
    },
    {
      title: "Romance Movies",
      fn: fetchMoviesByGenre,
      params: [10749, 1],
      id: "romance",
    },
    {
      title: "Sci-Fi Movies",
      fn: fetchMoviesByGenre,
      params: [878, 1],
      id: "scifi",
    },
  ],
  "TV Shows": [
    {
      title: "Airing Today",
      fn: fetchAiringTodayTVShows,
      params: [1],
      id: "airing_today",
    },
    {
      title: "On The Air",
      fn: fetchOnTheAirTVShows,
      params: [1],
      id: "on_the_air",
    },
    {
      title: "Top Rated TV Shows",
      fn: fetchTopRatedTVShows,
      params: [2],
      id: "top_rated_tv",
    },
    {
      title: "Drama Series",
      fn: fetchTVShowsByGenre,
      params: [18, 1],
      id: "drama",
    },
    {
      title: "Comedy Series",
      fn: fetchTVShowsByGenre,
      params: [35, 1],
      id: "comedy_tv",
    },
    {
      title: "Crime Shows",
      fn: fetchTVShowsByGenre,
      params: [80, 1],
      id: "crime",
    },
    {
      title: "Sci-Fi & Fantasy",
      fn: fetchTVShowsByGenre,
      params: [10765, 1],
      id: "scifi_tv",
    },
    {
      title: "Animation",
      fn: fetchTVShowsByGenre,
      params: [16, 1],
      id: "animation",
    },
  ],
};

const INITIAL_LOAD_COUNT = 7;
const INCREMENTAL_LOAD_COUNT = 4;

// --- Sub-Components ---

const MovieItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.showCard}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
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
));

const HorizontalList = memo(({ title, data, loading, onShowPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animation when loading becomes false
  useEffect(() => {
    if (!loading && data && data.length > 0) {
      // Slight delay to allow images to start loading
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  const renderItem = useCallback(
    ({ item }) => <MovieItem item={item} onPress={onShowPress} />,
    [onShowPress]
  );

  if (loading) {
    return <SkeletonRow />;
  }

  if (!data || data.length === 0) return null;

  return (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.showList}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={3}
        removeClippedSubviews={true}
      />
    </Animated.View>
  );
});

const BrandSection = memo(({ navigation }) => (
  <View style={styles.brandSection}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.brandList}
    >
      {[
        { name: "Marvel", img: require("../../assets/marvel.png") },
        { name: "Star Wars", img: require("../../assets/star-wars.png") },
        { name: "Anime", img: require("../../assets/anime.png") },
        { name: "Hulu", img: require("../../assets/hulu.png") },
        { name: "Disney", img: require("../../assets/disneyplus.jpg") },
        { name: "DC", img: require("../../assets/dc.jpg") },
        { name: "HBO Max", img: require("../../assets/max.jpg") },
        { name: "Prime Video", img: null, text: true },
      ].map((brand, index) => (
        <TouchableOpacity
          key={index}
          style={styles.brandCard}
          onPress={() =>
            navigation.navigate("Franchise", { franchise: brand.name })
          }
        >
          {brand.text ? (
            <Text style={styles.brandPlaceholder}>{brand.name}</Text>
          ) : (
            <Image
              source={brand.img}
              style={styles.brandImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
));

const FeaturedCarousel = memo(({ data, loading, navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) return <SkeletonFeatured />;
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={`featured-${index}`}
            style={styles.featuredSlide}
            onPress={() => navigation.navigate("ShowDetails", { show: item })}
          >
            <Image
              source={{ uri: item.backdrop || item.image }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <TouchableOpacity style={styles.playButtonInline}>
                  <PlayIcon size={16} color={colors.black} />
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.carouselDots}>
        {data.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
});

// --- Main Screen Component ---

const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("Home");
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);

  // Sections state: Array of { id, title, data, loading }
  const [sections, setSections] = useState([]);
  const [featuredData, setFeaturedData] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [userAvatar, setUserAvatar] = useState({
    seed: "user1",
    colorIndex: 0,
  });

  // Load Initial Content when Tab Changes
  useEffect(() => {
    let isCancelled = false;
    loadUserProfile();

    const loadTab = async () => {
      // Immediate state reset to show skeletons
      setSections([]);
      setFeaturedLoading(true);
      setLoadedCount(0);

      const config = SECTIONS_CONFIG[selectedTab] || [];

      // Create initial placeholders
      const initialBatch = config.slice(0, INITIAL_LOAD_COUNT);
      const initialSections = initialBatch.map((item) => ({
        ...item,
        data: [],
        loading: true,
      }));

      if (isCancelled) return;
      setSections(initialSections);
      setLoadedCount(initialBatch.length);

      // If Home tab, fetch featured content (Trending) separately
      if (selectedTab === "Home") {
        try {
          const trendingData = await fetchTrending("week");
          if (!isCancelled) {
            setFeaturedData(trendingData.slice(0, 4));
            setFeaturedLoading(false);
          }
        } catch (e) {
          console.error("Error loading featured:", e);
          if (!isCancelled) setFeaturedLoading(false);
        }
      } else {
        setFeaturedLoading(false);
      }

      // Fetch data for initial sections
      if (!isCancelled) {
        fetchSectionsdata(initialBatch, 0, isCancelled);
      }
    };

    loadTab();

    return () => {
      isCancelled = true;
    };
  }, [selectedTab]);

  const loadUserProfile = async () => {
    try {
      const supabaseProfile = await getUserProfile();
      if (supabaseProfile) {
        setUserAvatar({
          seed: supabaseProfile.avatarSeed || "user1",
          colorIndex: supabaseProfile.avatarColorIndex || 0,
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const fetchSectionsdata = async (batch, startIndex, isCancelled = false) => {
    // Fetch in parallel
    const promises = batch.map(async (section, index) => {
      try {
        const data = await section.fn(...(section.params || []));

        // Update this specific section in state
        setSections((prev) => {
          const newSections = [...prev];
          const targetIndex = startIndex + index;
          if (newSections[targetIndex]) {
            newSections[targetIndex] = {
              ...newSections[targetIndex],
              data,
              loading: false,
            };
          }
          return newSections;
        });
      } catch (error) {
        console.error(`Error loading section ${section.title}:`, error);
        setSections((prev) => {
          const newSections = [...prev];
          const targetIndex = startIndex + index;
          if (newSections[targetIndex]) {
            newSections[targetIndex] = {
              ...newSections[targetIndex],
              loading: false,
              error: true,
            };
          }
          return newSections;
        });
      }
    });

    await Promise.all(promises);
  };

  const handleLoadMore = () => {
    const config = SECTIONS_CONFIG[selectedTab];
    if (loadedCount >= config.length) return;

    const nextBatch = config.slice(
      loadedCount,
      loadedCount + INCREMENTAL_LOAD_COUNT
    );
    if (nextBatch.length === 0) return;

    // Add skeletons for next batch
    const newPlaceholders = nextBatch.map((item) => ({
      ...item,
      data: [],
      loading: true,
    }));

    const startIndex = loadedCount;
    setSections((prev) => [...prev, ...newPlaceholders]);
    setLoadedCount((prev) => prev + nextBatch.length);

    // Fetch
    fetchSectionsdata(nextBatch, startIndex);
  };

  const handleBrowseOption = (option) => {
    setShowBrowseMenu(false);
    if (option === "TV Shows" || option === "Movies") {
      setSelectedTab(option);
    } else if (option === "My List") {
      navigation.navigate("MyList");
    } else if (option === "Manage Profiles") {
      navigation.navigate("UserProfile");
    }
  };

  const handleSignOut = () => {
    setShowBrowseMenu(false);
    navigation.navigate("Auth");
  };

  const renderHeader = () => (
    <View>
      {selectedTab === "Home" && (
        <>
          <FeaturedCarousel
            data={featuredData}
            loading={featuredLoading}
            navigation={navigation}
          />
          <BrandSection navigation={navigation} />
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={() => {
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
            <Image
              source={{
                uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${userAvatar.seed}&size=80&backgroundColor=transparent`,
              }}
              style={styles.profileAvatar}
              resizeMode="contain"
            />
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

      {/* Main Content List */}
      <FlatList
        data={sections}
        renderItem={({ item }) => (
          <HorizontalList
            title={item.title}
            data={item.data}
            loading={item.loading}
            onShowPress={(show) => navigation.navigate("ShowDetails", { show })}
          />
        )}
        keyExtractor={(item, index) => `${selectedTab}-${item.id}-${index}`}
        ListHeaderComponent={renderHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        extraData={selectedTab}
      />
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
    zIndex: 2000,
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
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#1B264F",
  },
  dropdownContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 3000,
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
    backgroundColor: "rgba(0,0,0,0.3)", // Fallback
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
    width: 200,
    height: 110,
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    elevation: 5,
  },
  brandImage: {
    width: "100%",
    height: "100%",
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
    width: 110,
    marginRight: 10,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  showImage: {
    width: 110,
    height: 150,
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
});

export default HomeScreen;
