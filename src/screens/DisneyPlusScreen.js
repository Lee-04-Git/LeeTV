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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;
const CARD_WIDTH = SCREEN_WIDTH * 0.30;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const BRAND_TILE_SIZE = (SCREEN_WIDTH - 48) / 5;

// Disney+ brand colors
const DISNEY_DARK = "#0E0B14";
const DISNEY_BLUE = "#0063E5";
const DISNEY_LIGHT_BLUE = "#1A91FF";
const DISNEY_GRADIENT_START = "#0D1B2A";
const DISNEY_GRADIENT_END = "#0E0B14";

// Disney brand tiles
const BRAND_TILES = [
  { id: "disney", name: "Disney", image: require("../../assets/new-disneyplus-icon.jpg"), color: "#1A1D29" },
  { id: "pixar", name: "Pixar", image: null, color: "#1A1D29", text: "PIXAR" },
  { id: "marvel", name: "Marvel", image: require("../../assets/marvel.png"), color: "#1A1D29" },
  { id: "starwars", name: "Star Wars", image: require("../../assets/star-wars.png"), color: "#1A1D29" },
  { id: "natgeo", name: "National Geographic", image: null, color: "#1A1D29", text: "NAT GEO" },
];

const DisneyPlusScreen = ({ navigation }) => {
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
    inputRange: [0, 120],
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("Disney+");
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
        
        // Featured items
        const topRated = uniqueItems.filter(i => i.rating >= 7 && i.backdrop).slice(0, 6);
        setFeaturedItems(topRated.length > 0 ? topRated : uniqueItems.filter(i => i.backdrop).slice(0, 6));
      }
    } catch (error) {
      console.error("Error loading Disney+ content:", error);
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
      franchise: "Disney+",
    });
  };

  const handleBrandPress = (brand) => {
    if (brand.id === "marvel") {
      navigation.navigate("Franchise", { franchise: "Marvel" });
    } else if (brand.id === "starwars") {
      navigation.navigate("Franchise", { franchise: "Star Wars" });
    }
  };

  // Render card
  const renderCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.cardGradient}
      />
    </TouchableOpacity>
  ), []);

  // Render section
  const renderSection = (section, index) => {
    if (!section.data || section.data.length === 0) return null;
    
    return (
      <View key={`${section.id}-${index}`} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 6 && (
            <TouchableOpacity onPress={() => handleSeeAll(section)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={section.data.slice(0, 15)}
          renderItem={renderCard}
          keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        />
      </View>
    );
  };

  // Brand tiles
  const renderBrandTiles = () => (
    <View style={styles.brandContainer}>
      {BRAND_TILES.map((brand) => (
        <TouchableOpacity
          key={brand.id}
          style={styles.brandTile}
          onPress={() => handleBrandPress(brand)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.brandGradient}
          >
            {brand.image ? (
              <Image source={brand.image} style={styles.brandImage} resizeMode="contain" />
            ) : (
              <Text style={styles.brandText}>{brand.text}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

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
                  colors={['transparent', 'rgba(14,11,20,0.5)', 'rgba(14,11,20,0.9)', DISNEY_DARK]}
                  locations={[0.2, 0.5, 0.75, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <Image 
                      source={require("../../assets/new-disneyplus-icon.jpg")} 
                      style={styles.heroDisneyLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.heroMeta}>
                      <Text style={styles.heroYear}>{item.year}</Text>
                      <View style={styles.heroDot} />
                      <Text style={styles.heroType}>{item.type === 'tv' ? 'Series' : 'Film'}</Text>
                      <View style={styles.heroDot} />
                      <View style={styles.heroRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.heroRatingText}>{item.rating}</Text>
                      </View>
                    </View>
                    <View style={styles.heroButtons}>
                      <TouchableOpacity style={styles.watchBtn} onPress={() => handleContentPress(item)}>
                        <Ionicons name="play-sharp" size={20} color="#fff" />
                        <Text style={styles.watchBtnText}>PLAY</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addBtn}>
                        <Ionicons name="add" size={26} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.groupBtn}>
                        <Ionicons name="people-outline" size={22} color="#fff" />
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
              style={[styles.heroDot2, activeHeroIndex === index && styles.heroDotActive]} 
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
        <LinearGradient colors={[DISNEY_GRADIENT_START, DISNEY_DARK]} style={styles.searchGradient}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Disney+"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
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
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#4B5563" />
                <Text style={styles.noResultsText}>No results found</Text>
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
        <Image 
          source={require("../../assets/new-disneyplus-icon.jpg")} 
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={DISNEY_BLUE} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Fixed Header */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={[DISNEY_DARK, DISNEY_DARK]} style={styles.headerGradientBg} />
      </Animated.View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Image 
          source={require("../../assets/new-disneyplus-icon.jpg")} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
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
        
        {/* Brand Tiles */}
        {renderBrandTiles()}
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['all', 'movies', 'series'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'movies' ? 'Movies' : 'Series'}
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
    backgroundColor: DISNEY_DARK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DISNEY_DARK,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 100,
  },
  headerBtn: {
    padding: 8,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  heroDisneyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  heroType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroRatingText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISNEY_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  groupBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroPagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  heroDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  // Brand Tiles
  brandContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  brandTile: {
    width: BRAND_TILE_SIZE,
    height: BRAND_TILE_SIZE * 0.6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  brandGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandImage: {
    width: '70%',
    height: '70%',
  },
  brandText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Count
  countText: {
    color: 'rgba(255,255,255,0.5)',
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
    fontWeight: '700',
  },
  seeAllBtn: {
    padding: 4,
  },
  seeAllText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  rowContent: {
    paddingHorizontal: 12,
  },
  // Cards
  card: {
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  // Search
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
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
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
    color: DISNEY_LIGHT_BLUE,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  searchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchGridItem: {
    width: (SCREEN_WIDTH - 40) / 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  searchGridImage: {
    width: '100%',
    aspectRatio: 2/3,
    backgroundColor: '#1F2937',
    borderRadius: 6,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  bottomPadding: {
    height: 50,
  },
});

export default DisneyPlusScreen;
