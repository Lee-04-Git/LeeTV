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
const HERO_HEIGHT = SCREEN_HEIGHT * 0.52;
const CARD_WIDTH = SCREEN_WIDTH * 0.30;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const WIDE_CARD_WIDTH = SCREEN_WIDTH * 0.75;
const WIDE_CARD_HEIGHT = WIDE_CARD_WIDTH * 0.56;

// Paramount+ brand colors
const PARAMOUNT_BLUE = "#0064FF";
const PARAMOUNT_DARK = "#06121E";
const PARAMOUNT_NAVY = "#0A1628";
const PARAMOUNT_LIGHT_BLUE = "#00A3FF";

const ParamountScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [movieSections, setMovieSections] = useState([]);
  const [tvSections, setTVSections] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("Paramount+");
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
        
        const topRated = uniqueItems.filter(i => i.rating >= 7 && i.backdrop).slice(0, 5);
        setFeaturedItems(topRated.length > 0 ? topRated : uniqueItems.filter(i => i.backdrop).slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading Paramount+ content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = () => {
    if (activeTab === "movies") return movieSections;
    if (activeTab === "shows") return tvSections;
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
      franchise: "Paramount+",
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
        <View style={styles.peakBadge}>
          <Ionicons name="star" size={8} color="#FFD700" />
        </View>
      )}
    </TouchableOpacity>
  ), []);

  // Render wide card
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
          colors={['transparent', 'rgba(6,18,30,0.95)']}
          style={styles.wideCardGradient}
        >
          <Text style={styles.wideCardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.wideCardMeta}>
            <Text style={styles.wideCardYear}>{item.year}</Text>
            <View style={styles.wideCardDot} />
            <Text style={styles.wideCardType}>{item.type === 'tv' ? 'Series' : 'Movie'}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ), []);

  // Render section
  const renderSection = (section, index) => {
    if (!section.data || section.data.length === 0) return null;
    
    const isWideRow = section.title.includes("Trending");
    
    return (
      <View key={`${section.id}-${index}`} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.data.length > 6 && (
            <TouchableOpacity onPress={() => handleSeeAll(section)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color={PARAMOUNT_LIGHT_BLUE} />
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
                  colors={['transparent', 'rgba(6,18,30,0.6)', 'rgba(6,18,30,0.95)', PARAMOUNT_DARK]}
                  locations={[0.2, 0.5, 0.75, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.paramountTag}>
                      <Text style={styles.paramountTagText}>PARAMOUNT+ ORIGINAL</Text>
                    </View>
                    <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.heroOverview} numberOfLines={2}>{item.overview}</Text>
                    <View style={styles.heroButtons}>
                      <TouchableOpacity style={styles.watchBtn} onPress={() => handleContentPress(item)}>
                        <Ionicons name="play" size={18} color="#fff" />
                        <Text style={styles.watchBtnText}>Watch Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.listBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
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
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies, shows..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
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
              <Ionicons name="search-outline" size={48} color="#374151" />
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
          source={require("../../assets/paramount-plus-logo-icon.png")} 
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={PARAMOUNT_BLUE} style={{ marginTop: 20 }} />
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
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image 
          source={require("../../assets/paramount-plus-logo-icon.png")} 
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
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['home', 'movies', 'shows'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'home' ? 'Home' : tab === 'movies' ? 'Movies' : 'Shows'}
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
    backgroundColor: PARAMOUNT_DARK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: PARAMOUNT_DARK,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 70,
    height: 70,
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
    backgroundColor: PARAMOUNT_DARK,
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
    width: 36,
    height: 36,
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
  },
  paramountTag: {
    backgroundColor: PARAMOUNT_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  paramountTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroOverview: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PARAMOUNT_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
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
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroDotActive: {
    backgroundColor: PARAMOUNT_BLUE,
    width: 20,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: PARAMOUNT_BLUE,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Count
  countText: {
    color: '#6B7280',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: PARAMOUNT_LIGHT_BLUE,
    fontSize: 14,
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
    backgroundColor: PARAMOUNT_NAVY,
    borderRadius: 6,
  },
  peakBadge: {
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
  // Wide Cards
  wideCard: {
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  wideCardImage: {
    width: WIDE_CARD_WIDTH,
    height: WIDE_CARD_HEIGHT,
    backgroundColor: PARAMOUNT_NAVY,
  },
  wideCardImageStyle: {
    borderRadius: 8,
  },
  wideCardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    borderRadius: 8,
  },
  wideCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wideCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideCardYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  wideCardDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  wideCardType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  // Search
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PARAMOUNT_DARK,
    zIndex: 200,
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
    backgroundColor: PARAMOUNT_NAVY,
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
    color: PARAMOUNT_LIGHT_BLUE,
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
    gap: 10,
  },
  searchGridItem: {
    width: (SCREEN_WIDTH - 44) / 3,
  },
  searchGridImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 6,
    backgroundColor: PARAMOUNT_NAVY,
  },
  searchGridTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
  },
  noResultsText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 12,
  },
  bottomPadding: {
    height: 50,
  },
});

export default ParamountScreen;
