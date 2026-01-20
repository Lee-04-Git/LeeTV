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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.6;
const CARD_WIDTH = SCREEN_WIDTH * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.85;
const FEATURED_CARD_HEIGHT = FEATURED_CARD_WIDTH * 0.56;

// Apple TV+ brand colors - clean, minimal
const APPLE_BLACK = "#000000";
const APPLE_DARK = "#1C1C1E";
const APPLE_GRAY = "#2C2C2E";
const APPLE_LIGHT_GRAY = "#8E8E93";
const APPLE_WHITE = "#FFFFFF";
const APPLE_BLUE = "#0A84FF";

const AppleTVScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [movieSections, setMovieSections] = useState([]);
  const [tvSections, setTVSections] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  
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
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadContent();
  }, []);

  // Auto-scroll hero
  useEffect(() => {
    if (featuredItems.length > 1) {
      const interval = setInterval(() => {
        setActiveHeroIndex(prev => {
          const next = (prev + 1) % featuredItems.length;
          heroScrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
          return next;
        });
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [featuredItems]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("Apple TV+");
      if (content && content.hasTabs) {
        setMovieSections(content.movieSections || []);
        setTVSections(content.tvSections || []);
        setTotalCount(content.totalContent || 0);
        
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
        
        // Featured items - top rated with backdrops
        const topRated = uniqueItems.filter(i => i.rating >= 7 && i.backdrop).slice(0, 5);
        setFeaturedItems(topRated.length > 0 ? topRated : uniqueItems.filter(i => i.backdrop).slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading Apple TV+ content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = () => {
    if (activeTab === "movies") return movieSections;
    if (activeTab === "series") return tvSections;
    const combined = [];
    const maxLen = Math.max(movieSections.length, tvSections.length);
    for (let i = 0; i < maxLen; i++) {
      if (movieSections[i]) combined.push(movieSections[i]);
      if (tvSections[i]) combined.push(tvSections[i]);
    }
    return combined;
  };

  // Search
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
      franchise: "Apple TV+",
    });
  };

  // Render card
  const renderCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      {item.rating >= 8 && (
        <View style={styles.appleBadge}>
          <Ionicons name="star-sharp" size={8} color="#FFD700" />
        </View>
      )}
    </TouchableOpacity>
  ), []);

  // Render featured card
  const renderFeaturedCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.95}
    >
      <ImageBackground 
        source={{ uri: item.backdrop || item.image }} 
        style={styles.featuredCardImage}
        imageStyle={styles.featuredCardImageStyle}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.featuredCardGradient}
        >
          <View style={styles.featuredCardContent}>
            <View style={styles.appleOriginalTag}>
              <Ionicons name="logo-apple" size={12} color="#fff" />
              <Text style={styles.appleOriginalText}>Original</Text>
            </View>
            <Text style={styles.featuredCardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.featuredCardMeta}>{item.year} · {item.type === 'tv' ? 'Series' : 'Film'}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ), []);

  // Render section
  const renderSection = (section, index) => {
    if (!section.data || section.data.length === 0) return null;
    
    const isFeaturedRow = section.title.includes("Trending");
    
    return (
      <View key={`${section.id}-${index}`} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 6 && (
            <TouchableOpacity onPress={() => handleSeeAll(section)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={APPLE_BLUE} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.data.slice(0, 15)}
          renderItem={isFeaturedRow ? renderFeaturedCard : renderCard}
          keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
          snapToInterval={isFeaturedRow ? FEATURED_CARD_WIDTH + 12 : undefined}
          decelerationRate={isFeaturedRow ? "fast" : "normal"}
        />
      </View>
    );
  };

  // Hero
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
              activeOpacity={1}
              onPress={() => handleContentPress(item)}
            >
              <ImageBackground
                source={{ uri: item.backdrop || item.image }}
                style={styles.heroSlide}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)', APPLE_BLACK]}
                  locations={[0, 0.4, 0.75, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.heroAppleTag}>
                      <Ionicons name="logo-apple" size={14} color="#fff" />
                      <Text style={styles.heroAppleText}>tv+</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.heroOverview} numberOfLines={2}>{item.overview}</Text>
                    <View style={styles.heroButtons}>
                      <TouchableOpacity style={styles.watchBtn} onPress={() => handleContentPress(item)}>
                        <Ionicons name="play-sharp" size={18} color="#000" />
                        <Text style={styles.watchBtnText}>Watch Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addListBtn}>
                        <Ionicons name="add" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Pagination */}
        <View style={styles.heroPagination}>
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
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color={APPLE_LIGHT_GRAY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Movies, Shows, and More"
              placeholderTextColor={APPLE_LIGHT_GRAY}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={18} color={APPLE_LIGHT_GRAY} />
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
                  <Text style={styles.searchGridMeta}>{item.type === 'tv' ? 'Series' : 'Film'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={44} color={APPLE_GRAY} />
              <Text style={styles.noResultsText}>No Results</Text>
              <Text style={styles.noResultsSubtext}>Try a different search</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Ionicons name="logo-apple" size={48} color="#fff" />
        <Text style={styles.loadingLogo}>tv+</Text>
        <ActivityIndicator size="small" color="#fff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Fixed Header */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerBg} />
      </Animated.View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerLogo}>
          <Ionicons name="logo-apple" size={22} color="#fff" />
          <Text style={styles.headerLogoText}>tv+</Text>
        </View>
        <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.headerBtn}>
          <Ionicons name="search" size={24} color="#fff" />
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
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['all', 'movies', 'series'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'For You' : tab === 'movies' ? 'Films' : 'Series'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Count */}
        <Text style={styles.countText}>{totalCount} titles</Text>
        
        {/* Sections */}
        {getSections().map((section, index) => renderSection(section, index))}
        
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Search */}
      {renderSearchOverlay()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPLE_BLACK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: APPLE_BLACK,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginTop: -8,
  },
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 99,
  },
  headerBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    position: 'absolute',
    top: StatusBar.currentHeight || 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 100,
  },
  headerBtn: {
    padding: 8,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 2,
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
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  heroAppleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroAppleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroOverview: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  watchBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  addListBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroDotActive: {
    backgroundColor: '#fff',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  tab: {
    paddingVertical: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: APPLE_LIGHT_GRAY,
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Count
  countText: {
    color: APPLE_LIGHT_GRAY,
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  // Sections
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: APPLE_BLUE,
    fontSize: 15,
    fontWeight: '500',
  },
  rowContent: {
    paddingHorizontal: 16,
  },
  // Cards
  card: {
    marginHorizontal: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: APPLE_DARK,
    borderRadius: 10,
  },
  appleBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Featured Cards
  featuredCard: {
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredCardImage: {
    width: FEATURED_CARD_WIDTH,
    height: FEATURED_CARD_HEIGHT,
    backgroundColor: APPLE_DARK,
  },
  featuredCardImageStyle: {
    borderRadius: 12,
  },
  featuredCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    borderRadius: 12,
  },
  featuredCardContent: {},
  appleOriginalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  appleOriginalText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredCardMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  // Search
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: APPLE_BLACK,
    zIndex: 200,
    paddingTop: StatusBar.currentHeight || 44,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APPLE_GRAY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    padding: 0,
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    color: APPLE_BLUE,
    fontSize: 17,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchGridItem: {
    width: (SCREEN_WIDTH - 56) / 3,
  },
  searchGridImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: APPLE_DARK,
  },
  searchGridTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  searchGridMeta: {
    color: APPLE_LIGHT_GRAY,
    fontSize: 12,
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtext: {
    color: APPLE_LIGHT_GRAY,
    fontSize: 15,
    marginTop: 4,
  },
  bottomPadding: {
    height: 50,
  },
});

export default AppleTVScreen;
