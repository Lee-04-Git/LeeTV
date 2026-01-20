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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.48;
const CARD_WIDTH = SCREEN_WIDTH * 0.38;
const CARD_HEIGHT = CARD_WIDTH * 0.56;
const POSTER_WIDTH = SCREEN_WIDTH * 0.30;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

// ESPN brand colors
const ESPN_RED = "#D00000";
const ESPN_DARK = "#121212";
const ESPN_GRAY = "#1E1E1E";
const ESPN_LIGHT_GRAY = "#2A2A2A";

const ESPNScreen = ({ navigation }) => {
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
    inputRange: [0, 80],
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
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [featuredItems]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("ESPN");
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
        
        const topRated = uniqueItems.filter(i => i.backdrop).slice(0, 5);
        setFeaturedItems(topRated);
      }
    } catch (error) {
      console.error("Error loading ESPN content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = () => {
    if (activeTab === "films") return movieSections;
    if (activeTab === "shows") return tvSections;
    const combined = [];
    const maxLen = Math.max(movieSections.length, tvSections.length);
    for (let i = 0; i < maxLen; i++) {
      if (tvSections[i]) combined.push(tvSections[i]);
      if (movieSections[i]) combined.push(movieSections[i]);
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
      franchise: "ESPN",
    });
  };

  // Render wide card (landscape)
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
          colors={['transparent', 'rgba(18,18,18,0.95)']}
          style={styles.wideCardGradient}
        >
          <Text style={styles.wideCardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.wideCardMeta}>
            <Text style={styles.wideCardYear}>{item.year}</Text>
            {item.rating && item.rating !== "N/A" && (
              <>
                <View style={styles.wideCardDot} />
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.wideCardRating}>{item.rating}</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ), []);

  // Render poster card
  const renderPosterCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.posterCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.posterImage} />
    </TouchableOpacity>
  ), []);

  // Render section
  const renderSection = (section, index) => {
    if (!section.data || section.data.length === 0) return null;
    
    const isWideRow = section.title.includes("Trending") || section.title.includes("Sports Movies");
    
    return (
      <View key={`${section.id}-${index}`} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 5 && (
            <TouchableOpacity onPress={() => handleSeeAll(section)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color={ESPN_RED} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.data.slice(0, 12)}
          renderItem={isWideRow ? renderWideCard : renderPosterCard}
          keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
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
          {featuredItems.map((item) => (
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
                  colors={['transparent', 'rgba(18,18,18,0.7)', ESPN_DARK]}
                  locations={[0.3, 0.65, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.espnTag}>
                      <Text style={styles.espnTagText}>ESPN+</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.heroMeta}>{item.year} · {item.type === 'tv' ? 'Series' : 'Film'}</Text>
                    <TouchableOpacity style={styles.watchBtn} onPress={() => handleContentPress(item)}>
                      <Ionicons name="play" size={16} color="#fff" />
                      <Text style={styles.watchBtnText}>Watch</Text>
                    </TouchableOpacity>
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
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ESPN+"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
          {searchResults.length > 0 && (
            <View style={styles.searchList}>
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={`search-${item.id}-${index}`}
                  style={styles.searchItem}
                  onPress={() => handleResultPress(item)}
                >
                  <Image source={{ uri: item.backdrop || item.image }} style={styles.searchItemImage} />
                  <View style={styles.searchItemInfo}>
                    <Text style={styles.searchItemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.searchItemMeta}>{item.year} · {item.type === 'tv' ? 'Series' : 'Film'}</Text>
                  </View>
                  <Ionicons name="play-circle" size={28} color={ESPN_RED} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#444" />
              <Text style={styles.noResultsText}>No results found</Text>
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
        <Image 
          source={require("../../assets/espn-logo-icon.png")} 
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={ESPN_RED} style={{ marginTop: 20 }} />
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Image 
          source={require("../../assets/espn-logo-icon.png")} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.headerBtn}>
          <Ionicons name="search" size={22} color="#fff" />
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
          {['all', 'shows', 'films'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'For You' : tab === 'shows' ? 'Shows' : 'Films'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Count */}
        <Text style={styles.countText}>{totalCount} titles available</Text>
        
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
    backgroundColor: ESPN_DARK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: ESPN_DARK,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 80,
    height: 40,
  },
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    zIndex: 99,
  },
  headerBg: {
    flex: 1,
    backgroundColor: ESPN_DARK,
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
  headerBtn: {
    padding: 6,
  },
  headerLogo: {
    width: 60,
    height: 28,
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
    paddingBottom: 24,
  },
  espnTag: {
    backgroundColor: ESPN_RED,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  espnTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 14,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESPN_RED,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 6,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heroPagination: {
    position: 'absolute',
    bottom: 8,
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
    backgroundColor: ESPN_RED,
    width: 16,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: ESPN_GRAY,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: ESPN_GRAY,
  },
  tabActive: {
    backgroundColor: ESPN_RED,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  // Count
  countText: {
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  // Sections
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: ESPN_RED,
    fontSize: 13,
    fontWeight: '600',
  },
  rowContent: {
    paddingHorizontal: 12,
  },
  // Wide Cards
  wideCard: {
    marginHorizontal: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  wideCardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: ESPN_GRAY,
  },
  wideCardImageStyle: {
    borderRadius: 6,
  },
  wideCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    borderRadius: 6,
  },
  wideCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  wideCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideCardYear: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  wideCardDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 6,
  },
  wideCardRating: {
    color: '#FFD700',
    fontSize: 11,
    marginLeft: 3,
  },
  // Poster Cards
  posterCard: {
    marginHorizontal: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    backgroundColor: ESPN_GRAY,
    borderRadius: 6,
  },
  // Search
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ESPN_DARK,
    zIndex: 200,
    paddingTop: StatusBar.currentHeight || 44,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: ESPN_GRAY,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESPN_LIGHT_GRAY,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    padding: 0,
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    color: ESPN_RED,
    fontSize: 15,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
  },
  searchList: {
    paddingTop: 8,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ESPN_GRAY,
  },
  searchItemImage: {
    width: 80,
    height: 45,
    borderRadius: 4,
    backgroundColor: ESPN_GRAY,
  },
  searchItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchItemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchItemMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
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

export default ESPNScreen;
