import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import { SearchIcon, StarIcon } from "../components/Icons";
import {
  searchContent,
  fetchTrending,
  fetchAllMovies,
  fetchAllTVShows,
} from "../services/tmdbApi";

const { width } = Dimensions.get("window");

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [popularContent, setPopularContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allContent, setAllContent] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadPopularContent();
    loadAllContent();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
        setSearched(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const loadPopularContent = async () => {
    try {
      const content = await fetchTrending("week");
      setPopularContent(content.slice(0, 10));
    } catch (error) {
      console.error("Error loading popular content:", error);
    }
  };

  const loadAllContent = async () => {
    try {
      setLoadingData(true);
      const [movies, tvShows] = await Promise.all([
        fetchAllMovies(20), // 400 movies
        fetchAllTVShows(20), // 400 TV shows
      ]);
      setAllContent([...movies, ...tvShows]);
    } catch (error) {
      console.error("Error loading all content:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setSearched(true);

      // Use local filtering if data is loaded, otherwise use API
      if (allContent.length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const filtered = allContent.filter((item) =>
          item.title.toLowerCase().includes(query)
        );
        setSearchResults(filtered.slice(0, 50)); // Limit to 50 results for performance
      } else {
        // Fallback to API search
        const results = await searchContent(searchQuery);
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for shows, movies..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.netflixRed} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searched && searchQuery.length > 0 ? (
          // Search Results
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              {searchResults.length} Result
              {searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </Text>
            {searchResults.length > 0 ? (
              <View style={styles.resultsGrid}>
                {searchResults.map((show) => (
                  <TouchableOpacity
                    key={`${show.type}-${show.id}`}
                    style={styles.resultCard}
                    onPress={() => navigation.navigate("ShowDetails", { show })}
                  >
                    <Image
                      source={{ uri: show.image }}
                      style={styles.resultImage}
                      resizeMode="cover"
                    />
                    <View style={styles.resultOverlay}>
                      <View style={styles.resultRating}>
                        <StarIcon size={10} color="#FFD700" />
                        <Text style={styles.resultRatingText}>
                          {show.rating}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle} numberOfLines={2}>
                        {show.title}
                      </Text>
                      <Text style={styles.resultYear}>{show.year}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No results found for "{searchQuery}"
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching for something else
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Popular Content
          <View style={styles.popularContainer}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.popularGrid}>
              {popularContent.map((item) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  style={styles.popularCard}
                  onPress={() =>
                    navigation.navigate("ShowDetails", { show: item })
                  }
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.popularImage}
                    resizeMode="cover"
                  />
                  <View style={styles.popularOverlay}>
                    <View style={styles.popularRating}>
                      <StarIcon size={10} color="#FFD700" />
                      <Text style={styles.popularRatingText}>
                        {item.rating}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.popularTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.gray,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  resultCard: {
    width: width > 600 ? "23%" : "31%",
    marginBottom: 24,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)",
    elevation: 3,
  },
  resultOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  resultRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  resultRatingText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
  },
  resultInfo: {
    marginTop: 8,
  },
  resultTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 16,
  },
  resultYear: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "500",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtext: {
    color: colors.lightGray,
    fontSize: 14,
    textAlign: "center",
  },
  popularContainer: {
    marginTop: 10,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  popularCard: {
    width: width > 600 ? "23%" : "31%",
    marginBottom: 24,
  },
  popularImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)",
    elevation: 3,
  },
  popularOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  popularRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  popularRatingText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
  },
  popularTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  resultTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  popularContainer: {
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
});

export default SearchScreen;
