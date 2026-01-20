import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
  ImageBackground,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { BackIcon } from "../components/Icons";
import {
  fetchFranchiseContent,
  fetchAnime,
  fetchNetflix,
  fetchHulu,
  fetchDC,
  fetchMarvel,
  fetchStarWars,
  fetchHBOMax,
  fetchParamountPlus,
  fetchAppleTV,
  fetchUSANetwork,
  fetchTheCW,
  fetchESPN,
  fetchStructuredFranchiseContent,
} from "../services/tmdbApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.32;
const CARD_WIDTH = SCREEN_WIDTH * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// Franchise logos and hero images
const FRANCHISE_ASSETS = {
  Marvel: {
    logo: require("../../assets/marvel.png"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", // Avengers Endgame
      "https://image.tmdb.org/t/p/original/orjiB3oUIsyz60hoEqkiGpy5CeO.jpg", // Infinity War
    ],
  },
  "Star Wars": {
    logo: require("../../assets/star-wars.png"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/d9CqJnrSgLfkdqHoHOQbn0eRSgr.jpg",
    ],
  },
  DC: {
    logo: require("../../assets/dc.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
    ],
  },
  Disney: {
    logo: require("../../assets/new-disneyplus-icon.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/tNCbisMxO5mX2X7HfNmhJlNsQgc.jpg",
    ],
  },
  "Disney+": {
    logo: require("../../assets/new-disneyplus-icon.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/tNCbisMxO5mX2X7HfNmhJlNsQgc.jpg",
    ],
  },
  Netflix: {
    logo: require("../../assets/netflix-icon-logo.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    ],
  },
  "HBO Max": {
    logo: require("../../assets/max.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg",
    ],
  },
  Max: {
    logo: require("../../assets/max.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/rzdPqYx7Um4FUZeD8wpXqjAUcEm.jpg",
    ],
  },
  Anime: {
    logo: require("../../assets/anime.png"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    ],
  },
  Hulu: {
    logo: require("../../assets/hulu.png"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    ],
  },
  "Paramount+": {
    logo: require("../../assets/paramount-plus-logo-icon.png"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    ],
  },
  "Apple TV+": {
    logo: require("../../assets/apple-tv-icon-logo.jpg"),
    heroImages: [
      "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    ],
  },
  "Harry Potter": {
    textLogo: "Harry Potter",
    heroImages: [
      "https://image.tmdb.org/t/p/original/hziiv14OpD73u9gAak4XDDfBKa2.jpg", // Deathly Hallows
    ],
  },
  "Transformers": {
    remoteLogo: "https://image.tmdb.org/t/p/original/eOEQlOCaUCedkjzJD0GlmLWqsAL.jpg", // Transformers collection poster
    heroImages: [
      "https://image.tmdb.org/t/p/original/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg", // Transformers backdrop
    ],
  },
};

const FranchiseScreen = ({ navigation, route }) => {
  const { franchise } = route.params || {};
  
  // Redirect to dedicated screens
  useEffect(() => {
    if (franchise === "Netflix" || franchise === "Netflix Originals") {
      navigation.replace("Netflix");
    } else if (franchise === "HBO Max" || franchise === "Max") {
      navigation.replace("Max");
    } else if (franchise === "Apple TV+") {
      navigation.replace("AppleTV");
    } else if (franchise === "Disney+" || franchise === "Disney") {
      navigation.replace("DisneyPlus");
    } else if (franchise === "Paramount+") {
      navigation.replace("Paramount");
    } else if (franchise === "ESPN") {
      navigation.replace("ESPN");
    } else if (franchise === "USA Network") {
      navigation.replace("USANetwork");
    } else if (franchise === "The CW") {
      navigation.replace("TheCW");
    }
  }, [franchise, navigation]);
  
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const [heroBackdrop, setHeroBackdrop] = useState(null);

  // Structured content state for row-based layout
  const [structuredContent, setStructuredContent] = useState(null);
  const [useStructuredLayout, setUseStructuredLayout] = useState(false);
  
  // Combined sections state for streaming services
  const [movieSections, setMovieSections] = useState([]);
  const [tvSections, setTVSections] = useState([]);
  const [hasTabs, setHasTabs] = useState(false);
  const [totalContent, setTotalContent] = useState(0);
  const [contentTab, setContentTab] = useState("Movies"); // Movies or TV Shows

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [allContent, setAllContent] = useState([]); // Store all content for searching

  // Pagination state for lazy loading franchises
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedContent, setPaginatedContent] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [targetCount, setTargetCount] = useState(500);

  // Franchises that support structured row layout
  const structuredFranchises = [
    "Marvel",
    "Star Wars",
    "DC",
    "Disney",
    "Disney+",
    "Netflix",
    "Netflix Originals",
    "HBO Max",
    "Max",
    "Anime",
    "Harry Potter",
    "Transformers",
    "Hulu",
    "Paramount+",
    "Apple TV+",
    "The CW",
    "USA Network",
    "ESPN",
  ];

  // Check if franchise uses structured layout
  const supportsStructuredLayout = structuredFranchises.includes(franchise);

  // Check if franchise uses lazy loading (for non-structured franchises)
  const usesLazyLoading =
    !supportsStructuredLayout &&
    (franchise === "Hulu" ||
      franchise === "Paramount+" ||
      franchise === "Apple TV+" ||
      franchise === "USA Network" ||
      franchise === "The CW" ||
      franchise === "ESPN");

  // Get franchise assets
  const franchiseAssets = FRANCHISE_ASSETS[franchise] || {};

  useEffect(() => {
    if (supportsStructuredLayout) {
      loadStructuredContent();
    } else if (usesLazyLoading) {
      loadPaginatedContent(1, true);
    } else {
      loadFranchiseContent();
    }
  }, [franchise]);

  const loadStructuredContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent(franchise);
      if (content && content.sections && content.sections.length > 0) {
        setStructuredContent(content);
        setUseStructuredLayout(true);
        
        // Check if this franchise has tabs (Netflix, Disney+)
        if (content.hasTabs) {
          setHasTabs(true);
          // Skip first 3 rows (All Movies, Top Rated, New Releases)
          const filteredMovieSections = (content.movieSections || []).slice(3);
          const filteredTVSections = (content.tvSections || []).slice(3);
          setMovieSections(filteredMovieSections);
          setTVSections(filteredTVSections);
          setTotalContent(content.totalContent || 0);
          setContentTab("Movies"); // Default to Movies tab
          
          // Store all content for search
          const allMovies = content.movieSections?.[0]?.data || [];
          const allTV = content.tvSections?.[0]?.data || [];
          setAllContent([...allMovies, ...allTV]);
        }
        
        // Set hero backdrop from first content item
        const firstSection = content.sections[0];
        if (firstSection?.data?.[0]?.backdrop) {
          setHeroBackdrop(firstSection.data[0].backdrop);
        } else if (franchiseAssets.heroImages?.[0]) {
          setHeroBackdrop(franchiseAssets.heroImages[0]);
        }
      } else {
        loadPaginatedContent(1, true);
      }
    } catch (error) {
      console.error("Error loading structured content:", error);
      loadPaginatedContent(1, true);
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedContent = async (page, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setPaginatedContent([]);
      setCurrentPage(1);
      setHasMore(true);
      setUseStructuredLayout(false);
      if (franchise === "Hulu") {
        setTargetCount(200);
      } else if (franchise === "Paramount+") {
        setTargetCount(150);
      } else if (franchise === "Apple TV+") {
        setTargetCount(233);
      } else if (franchise === "USA Network") {
        setTargetCount(166);
      } else if (franchise === "The CW") {
        setTargetCount(182);
      } else if (franchise === "ESPN") {
        setTargetCount(102);
      } else {
        setTargetCount(500);
      }
    } else {
      setLoadingMore(true);
    }

    try {
      let data;
      if (franchise === "Hulu") {
        data = await fetchHulu(page);
      } else if (franchise === "Paramount+") {
        data = await fetchParamountPlus(page);
      } else if (franchise === "Apple TV+") {
        data = await fetchAppleTV(page);
      } else if (franchise === "USA Network") {
        data = await fetchUSANetwork(page);
      } else if (franchise === "The CW") {
        data = await fetchTheCW(page);
      } else if (franchise === "ESPN") {
        data = await fetchESPN(page);
      }

      if (data) {
        if (isInitial) {
          setPaginatedContent(data.results);
          if (data.results[0]?.backdrop) {
            setHeroBackdrop(data.results[0].backdrop);
          }
        } else {
          setPaginatedContent((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = data.results.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...prev, ...newItems];
          });
        }

        let maxCount = 500;
        if (franchise === "Hulu") maxCount = 200;
        else if (franchise === "Paramount+") maxCount = 150;
        else if (franchise === "Apple TV+") maxCount = 233;
        else if (franchise === "USA Network") maxCount = 166;
        else if (franchise === "The CW") maxCount = 182;
        else if (franchise === "ESPN") maxCount = 102;
        
        setHasMore(page < data.totalPages && paginatedContent.length < maxCount);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error(`Error loading ${franchise} content:`, error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFranchiseContent = async () => {
    setLoading(true);
    try {
      const { movies, tvShows } = await fetchFranchiseContent(franchise);
      setMovies(movies);
      setTVShows(tvShows);
      if (movies[0]?.backdrop) {
        setHeroBackdrop(movies[0].backdrop);
      }
    } catch (error) {
      console.error("Error loading franchise content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (usesLazyLoading && !loadingMore && hasMore && !useStructuredLayout) {
      loadPaginatedContent(currentPage + 1, false);
    }
  }, [usesLazyLoading, loadingMore, hasMore, currentPage, useStructuredLayout]);

  const getDisplayContent = () => {
    if (useStructuredLayout) return [];
    if (usesLazyLoading) return paginatedContent;
    if (selectedTab === "Movies") return movies;
    if (selectedTab === "TV Shows") return tvShows;
    return [...movies, ...tvShows];
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const handleSeeMore = (section) => {
    navigation.navigate("FranchiseCategory", {
      title: section.title,
      data: section.data,
      franchise: franchise,
    });
  };

  // Search functionality
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      const query = text.toLowerCase();
      const results = allContent.filter(item => 
        item.title?.toLowerCase().includes(query)
      ).slice(0, 8);
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchResultPress = (item) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
    navigation.navigate("ShowDetails", { show: item });
  };

  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      handleSearchResultPress(searchResults[0]);
    }
  };

  // Card component for horizontal rows
  const renderRowItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rowCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.rowPoster}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  // Section component for structured layout with See More
  const renderSection = (section) => {
    if (!section.data || section.data.length === 0) return null;
    
    return (
      <View key={section.id} style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 5 && (
            <TouchableOpacity 
              style={styles.seeMoreBtn} 
              onPress={() => handleSeeMore(section)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeMoreText}>See All</Text>
              <BackIcon size={14} color="#37d1e4" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.data.slice(0, 15)}
          renderItem={renderRowItem}
          keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        />
      </View>
    );
  };

  // Grid item for non-structured layout
  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.gridPoster}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Hero Banner Component
  const renderHeroBanner = () => {
    const backdropUrl = heroBackdrop || franchiseAssets.heroImages?.[0] || null;
    
    return (
      <View style={styles.heroContainer}>
        {backdropUrl ? (
          <ImageBackground
            source={{ uri: backdropUrl }}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', colors.background]}
              style={styles.heroGradient}
            >
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BackIcon size={22} color={colors.white} />
              </TouchableOpacity>
              
              {/* Franchise Logo */}
              {franchiseAssets.logo ? (
                <View style={styles.logoContainer}>
                  <Image
                    source={franchiseAssets.logo}
                    style={styles.franchiseLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : franchiseAssets.remoteLogo ? (
                <View style={styles.logoContainer}>
                  <Image
                    source={{ uri: franchiseAssets.remoteLogo }}
                    style={styles.franchiseRemoteLogo}
                    resizeMode="contain"
                  />
                </View>
              ) : franchiseAssets.textLogo ? (
                <View style={styles.logoContainer}>
                  <Text style={styles.franchiseTitle}>{franchiseAssets.textLogo}</Text>
                </View>
              ) : null}
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={[styles.heroBackground, styles.heroPlaceholder]}>
            <LinearGradient
              colors={['rgba(30,30,30,1)', colors.background]}
              style={styles.heroGradient}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BackIcon size={22} color={colors.white} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Text style={styles.franchiseTitle}>{franchise}</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading {franchise} content...</Text>
        </View>
      ) : useStructuredLayout && structuredContent ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderHeroBanner()}
            <View style={styles.contentContainer}>
              {/* Search Bar for Netflix and streaming services */}
              {hasTabs && (
                <View style={styles.searchContainer}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={`Search in ${franchise}...`}
                      placeholderTextColor="#555"
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      onSubmitEditing={handleSearchSubmit}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); setShowSearchDropdown(false); }}>
                        <Ionicons name="close-circle" size={18} color="#555" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Search Dropdown */}
                  {showSearchDropdown && (
                    <View style={styles.searchDropdown}>
                      {searchResults.map((item, index) => (
                        <TouchableOpacity
                          key={`search-${item.id}-${index}`}
                          style={styles.searchResultItem}
                          onPress={() => handleSearchResultPress(item)}
                          activeOpacity={0.7}
                        >
                          <Image source={{ uri: item.image }} style={styles.searchResultImage} />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.searchResultMeta}>{item.year} | {item.type === 'tv' ? 'Series' : 'Film'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#555" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {/* Total content count */}
              {hasTabs && totalContent > 0 && (
                <Text style={styles.totalCountText}>
                  {totalContent} titles available
                </Text>
              )}
              {/* Render all sections combined */}
              {hasTabs
                ? [...movieSections, ...tvSections].map(renderSection)
                : structuredContent.sections.map(renderSection)
              }
            </View>
          </ScrollView>
        </View>
      ) : (
        <FlatList
          data={getDisplayContent()}
          renderItem={renderGridItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={3}
          ListHeaderComponent={renderHeroBanner}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No content available for {franchise}
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Hero Banner Styles
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#1a1a1a',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 44,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  franchiseLogo: {
    width: SCREEN_WIDTH * 0.4,
    height: 60,
  },
  franchiseRemoteLogo: {
    width: SCREEN_WIDTH * 0.35,
    height: 120,
    borderRadius: 8,
  },
  franchiseTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Content Styles
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  // Content count style
  totalCountText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Section Styles
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMoreText: {
    color: '#37d1e4',
    fontSize: 13,
    fontWeight: '600',
  },
  rowContent: {
    paddingHorizontal: 16,
  },
  rowCard: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rowPoster: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  // Grid Styles (for non-structured franchises)
  gridContent: {
    paddingBottom: 30,
  },
  columnWrapper: {
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
  },
  gridCard: {
    flex: 1,
    maxWidth: '33.33%',
    padding: 4,
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.white,
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1929',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    padding: 0,
  },
  searchDropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#0a1929',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 209, 228, 0.3)',
    overflow: 'hidden',
    zIndex: 101,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultImage: {
    width: 40,
    height: 60,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultMeta: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
});

export default FranchiseScreen;
