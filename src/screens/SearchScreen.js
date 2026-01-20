import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { searchContent, fetchTrending, fetchMoviesByGenre, fetchTVShowsByGenre } from "../services/tmdbApi";

const { width } = Dimensions.get("window");
const RECENT_SEARCHES_KEY = "@recent_searches";
const MAX_RECENT_SEARCHES = 8;

// TMDB Genre IDs
const MOVIE_GENRES = [
  { id: 28, name: "Action", icon: "flash" },
  { id: 12, name: "Adventure", icon: "compass" },
  { id: 16, name: "Animation", icon: "color-palette" },
  { id: 35, name: "Comedy", icon: "happy" },
  { id: 80, name: "Crime", icon: "skull" },
  { id: 99, name: "Documentary", icon: "videocam" },
  { id: 18, name: "Drama", icon: "heart" },
  { id: 10751, name: "Family", icon: "people" },
  { id: 14, name: "Fantasy", icon: "sparkles" },
  { id: 36, name: "History", icon: "time" },
  { id: 27, name: "Horror", icon: "skull-outline" },
  { id: 10402, name: "Music", icon: "musical-notes" },
  { id: 9648, name: "Mystery", icon: "help-circle" },
  { id: 10749, name: "Romance", icon: "heart-circle" },
  { id: 878, name: "Sci-Fi", icon: "planet" },
  { id: 53, name: "Thriller", icon: "eye" },
  { id: 10752, name: "War", icon: "shield" },
  { id: 37, name: "Western", icon: "sunny" },
];

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure", icon: "flash" },
  { id: 16, name: "Animation", icon: "color-palette" },
  { id: 35, name: "Comedy", icon: "happy" },
  { id: 80, name: "Crime", icon: "skull" },
  { id: 99, name: "Documentary", icon: "videocam" },
  { id: 18, name: "Drama", icon: "heart" },
  { id: 10751, name: "Family", icon: "people" },
  { id: 10762, name: "Kids", icon: "balloon" },
  { id: 9648, name: "Mystery", icon: "help-circle" },
  { id: 10763, name: "News", icon: "newspaper" },
  { id: 10764, name: "Reality", icon: "tv" },
  { id: 10765, name: "Sci-Fi & Fantasy", icon: "planet" },
  { id: 10766, name: "Soap", icon: "chatbubbles" },
  { id: 10767, name: "Talk", icon: "mic" },
  { id: 10768, name: "War & Politics", icon: "shield" },
  { id: 37, name: "Western", icon: "sunny" },
];

const ContentCard = memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.contentCard} onPress={() => onPress(item)} activeOpacity={0.8}>
    <Image source={{ uri: item.image }} style={styles.contentImage} resizeMode="cover" />
    <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.contentGradient}>
      <View style={styles.contentRating}>
        <Ionicons name="star" size={10} color="#FFD700" />
        <Text style={styles.contentRatingText}>{item.rating}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

const GenreChip = memo(({ genre, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.genreChip, isSelected && styles.genreChipSelected]}
    onPress={() => onPress(genre)}
    activeOpacity={0.7}
  >
    <Ionicons name={genre.icon} size={14} color={isSelected ? "#000" : "#37d1e4"} />
    <Text style={[styles.genreChipText, isSelected && styles.genreChipTextSelected]}>{genre.name}</Text>
  </TouchableOpacity>
));

const RecentBubble = memo(({ query, onPress, onRemove }) => (
  <View style={styles.recentBubble}>
    <TouchableOpacity style={styles.recentBubbleContent} onPress={() => onPress(query)}>
      <Ionicons name="time-outline" size={14} color="#888" />
      <Text style={styles.recentText}>{query}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onRemove(query)} style={styles.recentRemoveBtn}>
      <Ionicons name="close" size={14} color="#666" />
    </TouchableOpacity>
  </View>
));

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Browse state
  const [contentType, setContentType] = useState("movie"); // "movie" or "tv"
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreContent, setGenreContent] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [trendingContent, setTrendingContent] = useState([]);

  const genres = contentType === "movie" ? MOVIE_GENRES : TV_GENRES;

  useEffect(() => {
    loadRecentSearches();
    loadTrendingContent();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      loadGenreContent(selectedGenre.id);
    }
  }, [selectedGenre, contentType]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setSearched(false);
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return;
      let updated = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      updated = [trimmed, ...updated].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const removeRecentSearch = async (query) => {
    try {
      const updated = recentSearches.filter(s => s !== query);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error removing recent search:", error);
    }
  };

  const clearAllRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  const loadTrendingContent = async () => {
    try {
      const content = await fetchTrending("week");
      setTrendingContent(content.slice(0, 10));
    } catch (error) {
      console.error("Error loading trending:", error);
    }
  };

  const loadGenreContent = async (genreId) => {
    setGenreLoading(true);
    try {
      const fetchFn = contentType === "movie" ? fetchMoviesByGenre : fetchTVShowsByGenre;
      const content = await fetchFn(genreId, 1);
      setGenreContent(content);
    } catch (error) {
      console.error("Error loading genre content:", error);
    } finally {
      setGenreLoading(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const results = await searchContent(searchQuery);
      setSearchResults(results);
      // Only save to recent if we got results
      if (results.length > 0) {
        saveRecentSearch(searchQuery);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const handleGenreSelect = (genre) => {
    if (selectedGenre?.id === genre.id) {
      setSelectedGenre(null);
      setGenreContent([]);
    } else {
      setSelectedGenre(genre);
    }
  };

  const handleTypeToggle = (type) => {
    setContentType(type);
    setSelectedGenre(null);
    setGenreContent([]);
  };

  const renderSearchResults = () => (
    <View style={styles.resultsSection}>
      <Text style={styles.sectionTitle}>
        {searchResults.length} Result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
      </Text>
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow} onPress={() => handleContentPress(item)} activeOpacity={0.8}>
              <Image source={{ uri: item.backdrop || item.image }} style={styles.resultImage} resizeMode="cover" />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultYear}>{item.year}</Text>
                  <View style={styles.resultDot} />
                  <Text style={styles.resultType}>{item.type === "tv" ? "Series" : "Film"}</Text>
                  <View style={styles.resultDot} />
                  <View style={styles.resultRating}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.resultRatingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `result-${item.type}-${item.id}`}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
        />
      ) : (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={48} color="#333" />
          <Text style={styles.noResultsTitle}>No results found</Text>
          <Text style={styles.noResultsText}>Try different keywords</Text>
        </View>
      )}
    </View>
  );

  const renderBrowseSection = () => (
    <>
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearAllRecentSearches}>
              <Text style={styles.clearAllText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
            {recentSearches.map((query, index) => (
              <RecentBubble
                key={index}
                query={query}
                onPress={(q) => setSearchQuery(q)}
                onRemove={removeRecentSearch}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content Type Toggle */}
      <View style={styles.toggleSection}>
        <Text style={styles.sectionTitle}>Browse by Genre</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, contentType === "movie" && styles.toggleBtnActive]}
            onPress={() => handleTypeToggle("movie")}
          >
            <Ionicons name="film" size={16} color={contentType === "movie" ? "#000" : "#888"} />
            <Text style={[styles.toggleText, contentType === "movie" && styles.toggleTextActive]}>Movies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, contentType === "tv" && styles.toggleBtnActive]}
            onPress={() => handleTypeToggle("tv")}
          >
            <Ionicons name="tv" size={16} color={contentType === "tv" ? "#000" : "#888"} />
            <Text style={[styles.toggleText, contentType === "tv" && styles.toggleTextActive]}>TV Shows</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Genre Chips */}
      <View style={styles.genreSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
          {genres.map((genre) => (
            <GenreChip
              key={genre.id}
              genre={genre}
              isSelected={selectedGenre?.id === genre.id}
              onPress={handleGenreSelect}
            />
          ))}
        </ScrollView>
      </View>

      {/* Genre Content or Trending */}
      {selectedGenre ? (
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{selectedGenre.name}</Text>
            <Text style={styles.contentCount}>{genreContent.length} titles</Text>
          </View>
          {genreLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#37d1e4" />
            </View>
          ) : (
            <FlatList
              data={genreContent}
              renderItem={({ item }) => <ContentCard item={item} onPress={handleContentPress} />}
              keyExtractor={(item) => `genre-${item.id}`}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.contentRow}
            />
          )}
        </View>
      ) : (
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <FlatList
            data={trendingContent}
            renderItem={({ item }) => <ContentCard item={item} onPress={handleContentPress} />}
            keyExtractor={(item) => `trending-${item.id}`}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.contentRow}
          />
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies, shows, genres..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#555" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#37d1e4" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searched && searchQuery.length > 2 ? (
          renderSearchResults()
        ) : (
          renderBrowseSection()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010e1f" },
  safeArea: { backgroundColor: "#010e1f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#0a1929",
  },
  backBtn: { padding: 8 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1929",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1a3a5c",
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16, padding: 0 },
  clearBtn: { padding: 4 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { paddingVertical: 80, alignItems: "center" },
  loadingText: { color: "#888", fontSize: 14, marginTop: 12 },

  /* Section Headers */
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  clearAllText: { color: "#37d1e4", fontSize: 14, fontWeight: "600" },
  contentCount: { color: "#888", fontSize: 13 },

  /* Recent Searches */
  recentSection: { paddingHorizontal: 16, paddingTop: 20 },
  recentScroll: { paddingTop: 4, gap: 8 },
  recentBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1929",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#1a3a5c",
    marginRight: 8,
  },
  recentBubbleContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  recentText: { color: "#ccc", fontSize: 13 },
  recentRemoveBtn: { padding: 4, marginLeft: 4 },

  /* Toggle */
  toggleSection: { paddingHorizontal: 16, paddingTop: 24 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#0a1929",
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1a3a5c",
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  toggleBtnActive: { backgroundColor: "#37d1e4" },
  toggleText: { color: "#888", fontSize: 14, fontWeight: "600" },
  toggleTextActive: { color: "#000" },

  /* Genre Chips */
  genreSection: { paddingTop: 16 },
  genreScroll: { paddingHorizontal: 16, gap: 8 },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1929",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#1a3a5c",
    marginRight: 8,
  },
  genreChipSelected: { backgroundColor: "#37d1e4", borderColor: "#37d1e4" },
  genreChipText: { color: "#37d1e4", fontSize: 13, fontWeight: "600" },
  genreChipTextSelected: { color: "#000" },

  /* Content Grid */
  contentSection: { paddingHorizontal: 16, paddingTop: 24 },
  contentRow: { justifyContent: "space-between", marginBottom: 10 },
  contentCard: {
    width: (width - 44) / 3,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0a1929",
  },
  contentImage: { width: "100%", height: "100%" },
  contentGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: "flex-end",
    padding: 6,
  },
  contentRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  contentRatingText: { color: "#FFD700", fontSize: 11, fontWeight: "700" },

  /* Search Results */
  resultsSection: { paddingHorizontal: 16, paddingTop: 20 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1929",
    borderRadius: 12,
    overflow: "hidden",
    paddingRight: 12,
  },
  resultImage: { width: 100, height: 70, backgroundColor: "#1a3a5c" },
  resultInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  resultTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resultMeta: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  resultYear: { color: "#888", fontSize: 12 },
  resultDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#555" },
  resultType: { color: "#37d1e4", fontSize: 12, fontWeight: "500" },
  resultRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  resultRatingText: { color: "#FFD700", fontSize: 11, fontWeight: "600" },
  resultOverview: { color: "#666", fontSize: 11, marginTop: 4, lineHeight: 15 },
  resultSeparator: { height: 10 },
  noResults: { alignItems: "center", paddingVertical: 60 },
  noResultsTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 16 },
  noResultsText: { color: "#666", fontSize: 14, marginTop: 6 },
});

export default SearchScreen;
