import React, { useState, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { searchContent, fetchMoviesByGenre, fetchTVShowsByGenre } from "../services/tmdbApi";

const { width } = Dimensions.get("window");

// Genre configuration with TMDB IDs
const GENRES = [
  { id: "action", name: "Action", movieGenreId: 28, tvGenreId: 10759 },
  { id: "comedy", name: "Comedy", movieGenreId: 35, tvGenreId: 35 },
  { id: "romance", name: "Romance", movieGenreId: 10749, tvGenreId: 10749 },
  { id: "thriller", name: "Thriller", movieGenreId: 53, tvGenreId: 9648 },
  { id: "adventure", name: "Adventure", movieGenreId: 12, tvGenreId: 10759 },
  { id: "fantasy", name: "Fantasy", movieGenreId: 14, tvGenreId: 10765 },
  { id: "horror", name: "Horror", movieGenreId: 27, tvGenreId: 9648 },
  { id: "animation", name: "Animation", movieGenreId: 16, tvGenreId: 16 },
];

// Memoized Genre Card Component
const GenreCard = memo(({ genre, onPress }) => (
  <TouchableOpacity
    style={styles.genreCard}
    onPress={() => onPress(genre)}
    activeOpacity={0.8}
  >
    <Text style={styles.genreCardText}>{genre.name}</Text>
  </TouchableOpacity>
));

// Memoized Search Result Item
const SearchResultItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.resultCard}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <Image
      source={{ uri: item.image }}
      style={styles.resultImage}
      resizeMode="cover"
    />
    <View style={styles.resultInfo}>
      <Text style={styles.resultTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.resultMeta}>
        {item.type === "tv" ? "Series" : "Movie"} • {item.year}
      </Text>
    </View>
  </TouchableOpacity>
));

const SearchScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const fromTab = route.params?.fromTab || "Home";

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchContent(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleGenrePress = useCallback((genre) => {
    navigation.navigate("CategoryContent", {
      title: genre.name,
      categoryId: `genre_${genre.id}`,
      categoryType: "mixed",
      genreIds: { movie: genre.movieGenreId, tv: genre.tvGenreId },
    });
  }, [navigation]);

  const handleResultPress = useCallback((item) => {
    navigation.navigate("ShowDetails", { show: item });
  }, [navigation]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

  const handleBack = useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

  const renderGenreItem = useCallback(({ item }) => (
    <GenreCard genre={item} onPress={handleGenrePress} />
  ), [handleGenrePress]);

  const renderSearchResult = useCallback(({ item }) => (
    <SearchResultItem item={item} onPress={handleResultPress} />
  ), [handleResultPress]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#010e1f" />
      
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by actor, title.."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {showResults ? (
          // Search Results
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#37d1e4" />
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#555" />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try searching for something else</Text>
              </View>
            )}
          </View>
        ) : (
          // Genres Grid
          <View style={styles.genresContainer}>
            <Text style={styles.genresTitle}>Genres</Text>
            <FlatList
              data={GENRES}
              renderItem={renderGenreItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.genreRow}
              contentContainerStyle={styles.genresList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010e1f",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2332",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginRight: 8,
  },
  micBtn: {
    padding: 4,
  },
  genresContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  genresTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  genresList: {
    paddingBottom: 100,
  },
  genreRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  genreCard: {
    width: (width - 44) / 2,
    height: 80,
    backgroundColor: "#1a2332",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3a4c",
  },
  genreCardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#1a2332",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a3a4c",
  },
  resultImage: {
    width: 100,
    height: 140,
    backgroundColor: "#0a1929",
  },
  resultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  resultTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultMeta: {
    color: "#888",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

export default SearchScreen;
