import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchStructuredFranchiseContent } from "../services/tmdbApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;
const CARD_WIDTH = SCREEN_WIDTH * 0.30;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const WIDE_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const WIDE_CARD_HEIGHT = WIDE_CARD_WIDTH * 0.56;

// Max brand colors
const MAX_PURPLE = "#5822B4";
const MAX_BLUE = "#0052FF";
const MAX_DARK = "#0D0D0D";
const MAX_GRADIENT_START = "#1A0A2E";
const MAX_GRADIENT_END = "#0D0D0D";

const MaxScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [movieSections, setMovieSections] = useState([]);
  const [tvSections, setTVSections] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // all, movies, series
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Hero carousel
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroScrollRef = useRef(null);
  
  // Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadContent();
  }, []);

  // Auto-scroll hero carousel
  useEffect(() => {
    if (featuredItems.length > 1) {
      const interval = setInterval(() => {
        setActiveHeroIndex(prev => {
          const next = (prev + 1) % featuredItems.length;
          heroScrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("HBO Max");
      if (content && content.hasTabs) {
        setMovieSections(content.movieSections || []);
        setTVSections(content.tvSections || []);
        setTotalCount(content.totalContent || 0);
        
        // Get all content for search
        const allMovies = content.movieSections?.flatMap(s => s.data) || [];
        const allTV = content.tvSections?.flatMap(s => s.data) || [];
        const allItems = [...allMovies, ...allTV];
        const uniqueItems = allItems.reduce((acc, item) => {
          if (!acc.find(i => i.id === item.id && i.type === item.type)) {
            acc.push(item);
          }
          return acc;
        }, []);
        setAllContent(uniqueItems);
        
        // Set featured items (top 5 highest rated)
        const topRated = uniqueItems.filter(i => i.rating >= 7.5 && i.backdrop).slice(0, 5);
        setFeaturedItems(topRated.length > 0 ? topRated : uniqueItems.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading Max content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = () => {
    if (activeTab === "movies") return movieSections;
    if (activeTab === "series") return tvSections;
    // Interleave movie and TV sections for "all" tab
    const combined = [];
    const maxLen = Math.max(movieSections.length, tvSections.length);
    for (let i = 0; i < maxLen; i++) {
      if (movieSections[i]) combined.push(movieSections[i]);
      if (tvSections[i]) combined.push(tvSections[i]);
    }
    return combined;
  };

  // Search handlers
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      const query = text.toLowerCase();
      const results = allContent.filter(item =>
        item.title?.toLowerCase().includes(query)
      ).slice(0, 12);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      navigation.navigate("ShowDetails", { show: searchResults[0] });
      closeSearch();
    }
  };

  const closeSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleResultPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
    closeSearch();
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const handleSeeAll = (section) => {
    navigation.navigate("FranchiseCategory", {
      title: section.title,
      data: section.data,
      franchise: "Max",
    });
  };

  // Render poster card
  const renderCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardInfo}>
          {item.rating >= 8 && (
            <View style={styles.maxBadge}>
              <Text style={styles.maxBadgeText}>MAX</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  ), []);

  // Render wide card for featured rows
  const renderWideCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.wideCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.9}
    >
      <ImageBackground 
        source={{ uri: item.backdrop || item.image }} 
        style={styles.wideCardImage}
        imageStyle={styles.wideCardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.wideCardGradient}
        >
          <Text style={styles.wideCardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.wideCardMeta}>
            <Text style={styles.wideCardYear}>{item.year}</Text>
            <View style={styles.wideCardRating}>
              <Ionicons name="star" size={11} color="#FFD700" />
              <Text style={styles.wideCardRatingText}>{item.rating}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ), []);

  // Render section
  const renderSection = (section, index) => {
    if (!section.data || section.data.length === 0) return null;
    
    const isWideRow = index === 0 || section.title.includes("Trending");
    
    return (
      <View key={`${section.id}-${index}`} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 6 && (
            <TouchableOpacity onPress={() => handleSeeAll(section)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={MAX_BLUE} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.data.slice(0, 15)}
          renderItem={isWideRow ? renderWideCard : renderCard}
          keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        />
      </View>
    );
  };

  // Hero carousel
  const renderHero = () => {
    if (featuredItems.length === 0) return null;
    
    return (
      <View style={styles.heroContainer}>
        <ScrollView
          ref={heroScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveHeroIndex(index);
          }}
        >
          {featuredItems.map((item, index) => (
            <TouchableOpacity 
              key={`hero-${item.id}`} 
              activeOpacity={0.95}
              onPress={() => handleContentPress(item)}
            >
              <ImageBackground
                source={{ uri: item.backdrop || item.image }}
                style={styles.heroSlide}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(13,13,13,0.4)', 'rgba(13,13,13,0.85)', MAX_DARK]}
                  locations={[0.2, 0.5, 0.75, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.heroMaxTag}>
                      <Text style={styles.heroMaxTagText}>MAX ORIGINAL</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.heroOverview} numberOfLines={2}>{item.overview}</Text>
                    <View style={styles.heroButtons}>
                      <TouchableOpacity style={styles.playBtn} onPress={() => handleContentPress(item)}>
                        <Ionicons name="play" size={20} color="#000" />
                        <Text style={styles.playBtnText}>Play</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.infoBtn} onPress={() => handleContentPress(item)}>
                        <Ionicons name="information-circle-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Pagination dots */}
        <View style={styles.heroDots}>
          {featuredItems.map((_, index) => (
            <View 
              key={`dot-${index}`} 
              style={[styles.heroDot, activeHeroIndex === index && styles.heroDotActive]} 
            />
          ))}
        </View>
      </View>
    );
  };

  // Search overlay
  const renderSearchOverlay = () => {
    if (!isSearching) return null;
    
    return (
      <View style={styles.searchOverlay}>
        <LinearGradient colors={[MAX_GRADIENT_START, MAX_DARK]} style={styles.searchGradient}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Max..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
            {searchResults.length > 0 && (
              <View style={styles.searchGrid}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`search-${item.id}-${index}`}
                    style={styles.searchGridItem}
                    onPress={() => handleResultPress(item)}
                  >
                    <Image source={{ uri: item.image }} style={styles.searchGridImage} />
                    <Text style={styles.searchGridTitle} numberOfLines={2}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#444" />
                <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LinearGradient colors={[MAX_PURPLE, MAX_DARK]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Max...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Fixed Header Background */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={[MAX_GRADIENT_START, MAX_DARK]} style={styles.headerGradientBg} />
      </Animated.View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image 
          source={require("../../assets/max.jpg")} 
          style={styles.maxLogo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.searchBtn}>
          <Ionicons name="search" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {renderHero()}
        
        {/* Tab Pills */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "movies" && styles.tabActive]}
            onPress={() => setActiveTab("movies")}
          >
            <Text style={[styles.tabText, activeTab === "movies" && styles.tabTextActive]}>Movies</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "series" && styles.tabActive]}
            onPress={() => setActiveTab("series")}
          >
            <Text style={[styles.tabText, activeTab === "series" && styles.tabTextActive]}>Series</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content count */}
        <Text style={styles.countText}>{totalCount} titles available</Text>
        
        {/* Sections */}
        {getSections().map((section, index) => renderSection(section, index))}
        
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Search Overlay */}
      {renderSearchOverlay()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MAX_DARK,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
  },
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 95,
    zIndex: 99,
  },
  headerGradientBg: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: StatusBar.currentHeight || 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 100,
  },
  backBtn: {
    padding: 6,
  },
  maxLogo: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  searchBtn: {
    padding: 6,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  // Hero
  heroContainer: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  heroMaxTag: {
    backgroundColor: MAX_PURPLE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroMaxTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroOverview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
    gap: 6,
  },
  playBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroDotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabActive: {
    backgroundColor: MAX_BLUE,
    borderColor: MAX_BLUE,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Count
  countText: {
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Sections
  section: {
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: MAX_BLUE,
    fontSize: 13,
    fontWeight: '500',
  },
  rowContent: {
    paddingHorizontal: 12,
  },
  // Cards
  card: {
    marginHorizontal: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxBadge: {
    backgroundColor: MAX_PURPLE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  maxBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Wide Cards
  wideCard: {
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  wideCardImage: {
    width: WIDE_CARD_WIDTH,
    height: WIDE_CARD_HEIGHT,
    backgroundColor: '#1a1a1a',
  },
  wideCardImageStyle: {
    borderRadius: 8,
  },
  wideCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    borderRadius: 8,
  },
  wideCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wideCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wideCardYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  wideCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wideCardRatingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  // Search Overlay
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  searchGradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    color: MAX_BLUE,
    fontSize: 15,
    fontWeight: '500',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  searchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchGridItem: {
    width: (SCREEN_WIDTH - 44) / 3,
  },
  searchGridImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  searchGridTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
  },
  noResultsText: {
    color: '#666',
    fontSize: 15,
    marginTop: 12,
  },
  bottomPadding: {
    height: 50,
  },
});

export default MaxScreen;
