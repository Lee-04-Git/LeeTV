import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategoryContent } from "../services/tmdbApi";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 42) / 3; // Slightly larger cards
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

const MovieItem = memo(({ item, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Netflix-style fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item)} activeOpacity={0.8}>
        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
      </TouchableOpacity>
    </Animated.View>
  );
});

// Skeleton Card Component - Only the card image, no rating
const SkeletonCard = memo(() => (
  <View style={styles.itemCard}>
    <View style={styles.skeletonImage} />
  </View>
));

// Skeleton Grid Component - Matches real grid layout
const SkeletonGrid = memo(() => {
  const skeletonItems = Array(12).fill(0).map((_, i) => ({ id: `skeleton-${i}` }));
  
  return (
    <FlatList
      data={skeletonItems}
      renderItem={() => <SkeletonCard />}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
});

const CategoryContentScreen = ({ route, navigation }) => {
  const { title, categoryId, categoryType, genreIds } = route.params;
  const [content, setContent] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [allTVShows, setAllTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [contentFilter, setContentFilter] = useState(null); // null, "movie", or "tv"
  const [filterLoading, setFilterLoading] = useState(false); // For skeleton during filter change

  useEffect(() => {
    loadContent();
  }, []);

  // Filter content when filter changes
  useEffect(() => {
    if (genreIds && (allMovies.length > 0 || allTVShows.length > 0)) {
      applyFilter();
    }
  }, [contentFilter]);

  const applyFilter = () => {
    if (!contentFilter) {
      // Show all
      setContent([...allMovies, ...allTVShows]);
    } else if (contentFilter === "movie") {
      setContent(allMovies);
    } else if (contentFilter === "tv") {
      setContent(allTVShows);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // If genreIds are provided, fetch both movies and TV shows for that genre
      if (genreIds) {
        // Fetch up to 200 titles total (100 movies + 100 TV shows)
        const moviePages = 5; // 5 pages × 20 = 100 movies
        const tvPages = 5; // 5 pages × 20 = 100 TV shows
        
        const moviePromises = [];
        const tvPromises = [];
        
        // Fetch movies
        for (let i = 1; i <= moviePages; i++) {
          moviePromises.push(
            fetchCategoryContent(`genre_${genreIds.movie}`, 'movie', i, 20)
          );
        }
        
        // Fetch TV shows
        for (let i = 1; i <= tvPages; i++) {
          tvPromises.push(
            fetchCategoryContent(`genre_${genreIds.tv}`, 'tv', i, 20)
          );
        }
        
        const [movieResults, tvResults] = await Promise.all([
          Promise.all(moviePromises),
          Promise.all(tvPromises),
        ]);
        
        // Combine and limit to 100 each
        const movies = movieResults.flatMap(result => result.results).slice(0, 100);
        const tvShows = tvResults.flatMap(result => result.results).slice(0, 100);
        
        console.log(`✅ Loaded ${movies.length} movies and ${tvShows.length} TV shows for ${title} (Total: ${movies.length + tvShows.length})`);
        
        // Store separately for filtering
        setAllMovies(movies);
        setAllTVShows(tvShows);
        setContent([...movies, ...tvShows]);
        setHasMore(false);
      } else {
        // For non-genre categories, fetch up to 200 items
        const pages = 10; // 10 pages × 20 = 200 items
        const promises = [];
        
        for (let i = 1; i <= pages; i++) {
          promises.push(fetchCategoryContent(categoryId, categoryType, i, 20));
        }
        
        const results = await Promise.all(promises);
        const allItems = results.flatMap(result => result.results).slice(0, 200);
        
        console.log(`✅ Loaded ${allItems.length} items for ${title}`);
        
        setContent(allItems);
        setHasMore(false);
      }
      setPage(1);
    } catch (error) {
      console.error("Error loading category content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((filter) => {
    setContentFilter(filter);
    setFilterLoading(true);
    
    // Smooth transition with skeleton
    setTimeout(() => {
      if (!filter) {
        setContent([...allMovies, ...allTVShows]);
      } else if (filter === "movie") {
        setContent(allMovies);
      } else if (filter === "tv") {
        setContent(allTVShows);
      }
      
      // Hide skeleton after content is set
      setTimeout(() => {
        setFilterLoading(false);
      }, 50); // Small delay for smooth transition
    }, 250); // Show skeleton for 250ms
  }, [allMovies, allTVShows]);

  const handleShowPress = useCallback((item) => {
    navigation.navigate("ShowDetails", { show: item });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <MovieItem item={item} onPress={handleShowPress} />
  ), [handleShowPress]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.countText}>{content.length} titles</Text>
          </View>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#37d1e4" />
          <Text style={styles.loadingText}>
            {genreIds ? "Loading up to 200 titles..." : "Loading content..."}
          </Text>
        </View>
      ) : filterLoading ? (
        <SkeletonGrid />
      ) : (
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${item.type}-${index}`}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={64} color="#555" />
              <Text style={styles.emptyText}>No content found</Text>
            </View>
          }
          // Optimized performance settings
          removeClippedSubviews={true}
          maxToRenderPerBatch={12}
          initialNumToRender={12}
          windowSize={10}
          updateCellsBatchingPeriod={100}
        />
      )}

      {/* Floating Filter Bar - Only show for genre pages */}
      {genreIds && !loading && (
        <View style={styles.floatingFilterContainer}>
          {!contentFilter ? (
            <View style={styles.floatingFilterBar}>
              <TouchableOpacity
                style={styles.floatingFilterItem}
                onPress={() => handleFilterChange("tv")}
                activeOpacity={0.7}
              >
                <Text style={styles.floatingFilterText}>Series</Text>
              </TouchableOpacity>
              <View style={styles.floatingFilterSeparator}>
                <Text style={styles.floatingFilterSeparatorText}>|</Text>
              </View>
              <TouchableOpacity
                style={styles.floatingFilterItem}
                onPress={() => handleFilterChange("movie")}
                activeOpacity={0.7}
              >
                <Text style={styles.floatingFilterText}>Movies</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.floatingFilterBarActive}>
              <Text style={styles.floatingFilterTextActive}>
                {contentFilter === "tv" ? "Series" : "Movies"}
              </Text>
              <TouchableOpacity 
                style={styles.floatingFilterCloseBtn}
                onPress={() => handleFilterChange(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010e1f" },
  safeArea: { backgroundColor: "#010e1f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1a3a5c",
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700" },
  headerRight: { marginLeft: 12 },
  countText: { color: "#888", fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#888", fontSize: 14, marginTop: 12 },
  gridContent: { 
    padding: 16, 
    paddingBottom: 100, // Extra padding for floating filter bar
  },
  itemCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginBottom: 12,
    marginRight: 8,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#0a1929",
  },
  itemImage: { 
    width: "100%", 
    height: "100%",
    backgroundColor: "#0a1929", // Fallback color while loading
  },
  
  // Skeleton styles - Only card image, no rating
  skeletonImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a2332",
  },
  
  loadingMore: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { color: "#888", fontSize: 16, marginTop: 16 },
  
  // Floating Filter Bar styles (same as HomeScreen)
  floatingFilterContainer: { 
    position: "absolute", 
    bottom: 40, // Moved up from 20
    left: 0, 
    right: 0, 
    alignItems: "center", 
    paddingHorizontal: 16,
    zIndex: 100,
  },
  floatingFilterBar: { 
    flexDirection: "row", 
    alignItems: "center",
    backgroundColor: "rgba(10,25,41,0.95)", 
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingFilterItem: { 
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  floatingFilterText: { 
    color: "rgba(255,255,255,0.7)", 
    fontSize: 13,
    fontWeight: "600" 
  },
  floatingFilterSeparator: {
    paddingHorizontal: 4,
  },
  floatingFilterSeparatorText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "400",
  },
  floatingFilterBarActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,25,41,0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  floatingFilterTextActive: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  floatingFilterCloseBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CategoryContentScreen;
