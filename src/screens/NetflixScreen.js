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
const CARD_WIDTH = SCREEN_WIDTH * 0.28;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// Netflix brand colors
const NETFLIX_RED = "#E50914";
const NETFLIX_BLACK = "#141414";
const NETFLIX_DARK = "#000000";

const NetflixScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [allContent, setAllContent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
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

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent("Netflix");
      if (content && content.hasTabs) {
        // Combine movie and TV sections, skip first 3 rows
        const movieSections = (content.movieSections || []).slice(3);
        const tvSections = (content.tvSections || []).slice(3);
        const combined = [...movieSections, ...tvSections];
        
        // Remove duplicates by section title
        const uniqueSections = combined.reduce((acc, section) => {
          if (!acc.find(s => s.title === section.title)) {
            acc.push(section);
          }
          return acc;
        }, []);
        
        setSections(uniqueSections);
        setTotalCount(content.totalContent || 0);
        
        // Get all content for search
        const allMovies = content.movieSections?.flatMap(s => s.data) || [];
        const allTV = content.tvSections?.flatMap(s => s.data) || [];
        const allItems = [...allMovies, ...allTV];
        // Remove duplicates
        const uniqueItems = allItems.reduce((acc, item) => {
          if (!acc.find(i => i.id === item.id && i.type === item.type)) {
            acc.push(item);
          }
          return acc;
        }, []);
        setAllContent(uniqueItems);
        
        // Set featured item (random from top rated)
        if (uniqueItems.length > 0) {
          const topRated = uniqueItems.filter(i => i.rating >= 7).slice(0, 10);
          const randomIndex = Math.floor(Math.random() * topRated.length);
          setFeaturedItem(topRated[randomIndex] || uniqueItems[0]);
        }
      }
    } catch (error) {
      console.error("Error loading Netflix content:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search handlers
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      const query = text.toLowerCase();
      const results = allContent.filter(item =>
        item.title?.toLowerCase().includes(query)
      ).slice(0, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      navigation.navigate("ShowDetails", { show: searchResults[0] });
      setSearchQuery("");
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleResultPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const handleSeeAll = (section) => {
    navigation.navigate("FranchiseCategory", {
      title: section.title,
      data: section.data,
      franchise: "Netflix",
    });
  };

  // Render card item
  const renderCard = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      {item.rating >= 8 && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>TOP</Text>
        </View>
      )}
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
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
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

  // Hero section
  const renderHero = () => {
    if (!featuredItem) return null;
    
    return (
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: featuredItem.backdrop || featuredItem.image }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(20,20,20,0.6)', NETFLIX_BLACK]}
            locations={[0.3, 0.7, 1]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>{featuredItem.title}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroYear}>{featuredItem.year}</Text>
                <View style={styles.heroDot} />
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.heroRatingText}>{featuredItem.rating}</Text>
                </View>
                <View style={styles.heroDot} />
                <Text style={styles.heroType}>{featuredItem.type === 'tv' ? 'Series' : 'Film'}</Text>
              </View>
              <View style={styles.heroButtons}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => handleContentPress(featuredItem)}
                >
                  <Ionicons name="play" size={22} color="#000" />
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => handleContentPress(featuredItem)}
                >
                  <Ionicons name="information-circle-outline" size={22} color="#fff" />
                  <Text style={styles.infoButtonText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
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
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search titles..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(""); setSearchResults([]); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
          {searchResults.map((item, index) => (
            <TouchableOpacity
              key={`search-${item.id}-${index}`}
              style={styles.searchResultItem}
              onPress={() => handleResultPress(item)}
            >
              <Image source={{ uri: item.image }} style={styles.searchResultImage} />
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.searchResultMeta}>
                  {item.year} {item.type === 'tv' ? 'Series' : 'Film'}
                </Text>
              </View>
              <Ionicons name="play-circle-outline" size={28} color={NETFLIX_RED} />
            </TouchableOpacity>
          ))}
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#555" />
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
        <ActivityIndicator size="large" color={NETFLIX_RED} />
        <Text style={styles.loadingText}>Loading...</Text>
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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Image 
          source={require("../../assets/netflix-icon-logo.jpg")} 
          style={styles.netflixLogo}
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
        
        {/* Category Pills */}
        <View style={styles.categoryPills}>
          <TouchableOpacity style={[styles.pill, styles.pillActive]}>
            <Text style={styles.pillTextActive}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill}>
            <Text style={styles.pillText}>Films</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pill}>
            <Text style={styles.pillText}>Series</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content count */}
        <Text style={styles.countText}>{totalCount} titles available</Text>
        
        {/* Sections */}
        {sections.map((section, index) => renderSection(section, index))}
        
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
    backgroundColor: NETFLIX_BLACK,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: NETFLIX_BLACK,
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
    height: 90,
    zIndex: 99,
  },
  headerBg: {
    flex: 1,
    backgroundColor: NETFLIX_BLACK,
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
  netflixLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
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
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroYear: {
    color: '#aaa',
    fontSize: 13,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 8,
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
  heroType: {
    color: '#aaa',
    fontSize: 13,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 6,
  },
  playButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(109,109,110,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 6,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  // Category Pills
  categoryPills: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  pillActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
  },
  pillTextActive: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
  },
  // Count
  countText: {
    color: '#888',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontWeight: 'bold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#fff',
    fontSize: 13,
  },
  rowContent: {
    paddingHorizontal: 12,
  },
  // Cards
  card: {
    marginHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#222',
    borderRadius: 4,
  },
  topBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: NETFLIX_RED,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  topBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Search Overlay
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: NETFLIX_BLACK,
    zIndex: 200,
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
    backgroundColor: '#333',
    borderRadius: 6,
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
  cancelText: {
    color: '#fff',
    fontSize: 15,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  searchResultImage: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  searchResultMeta: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  bottomPadding: {
    height: 40,
  },
});

export default NetflixScreen;
