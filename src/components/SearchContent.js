import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { searchContent } from "../services/tmdbApi";
import { supabase } from "../config/supabase";

const { width } = Dimensions.get("window");

// Genre configuration with TMDB IDs and local images
const GENRES = [
  { 
    id: "action", 
    name: "Action", 
    movieGenreId: 28, 
    tvGenreId: 10759,
    image: require("../../genre_images/action.webp")
  },
  { 
    id: "comedy", 
    name: "Comedy", 
    movieGenreId: 35, 
    tvGenreId: 35,
    image: require("../../genre_images/comedy.jpg")
  },
  { 
    id: "romance", 
    name: "Romance", 
    movieGenreId: 10749, 
    tvGenreId: 10749,
    image: require("../../genre_images/romance.webp")
  },
  { 
    id: "thriller", 
    name: "Thriller", 
    movieGenreId: 53, 
    tvGenreId: 9648,
    image: require("../../genre_images/thriller.webp")
  },
  { 
    id: "adventure", 
    name: "Adventure", 
    movieGenreId: 12, 
    tvGenreId: 10759,
    image: require("../../genre_images/adventure.jpg")
  },
  { 
    id: "fantasy", 
    name: "Fantasy", 
    movieGenreId: 14, 
    tvGenreId: 10765,
    image: require("../../genre_images/fantasy.jpg")
  },
  { 
    id: "horror", 
    name: "Horror", 
    movieGenreId: 27, 
    tvGenreId: 9648,
    image: require("../../genre_images/horror.webp")
  },
  { 
    id: "animation", 
    name: "Animation", 
    movieGenreId: 16, 
    tvGenreId: 16,
    image: require("../../genre_images/animation.jpg")
  },
];

// Memoized Genre Card Component - Netflix-style design
const GenreCard = memo(({ genre, onPress }) => (
  <TouchableOpacity
    style={styles.genreCard}
    onPress={() => onPress(genre)}
    activeOpacity={0.85}
  >
    <Image 
      source={genre.image} 
      style={styles.genreImage} 
      resizeMode="cover"
    />
    <LinearGradient
      colors={["rgba(1,14,31,0.2)", "rgba(1,14,31,0.6)", "rgba(1,14,31,0.95)"]}
      locations={[0, 0.4, 1]}
      style={styles.genreGradient}
    >
      <Text style={styles.genreCardText}>{genre.name}</Text>
    </LinearGradient>
  </TouchableOpacity>
));

// Dropdown Item with Poster
const DropdownItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.dropdownItem}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <Image
      source={{ uri: item.image }}
      style={styles.dropdownPoster}
      resizeMode="cover"
    />
    <View style={styles.dropdownInfo}>
      <Text style={styles.dropdownTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.dropdownMeta}>
        {item.type === "tv" ? "Series" : "Movie"} • {item.year}
      </Text>
    </View>
  </TouchableOpacity>
));

// Recent Search Title Item (with poster)
const RecentSearchItem = memo(({ item, onPress, onDelete }) => (
  <TouchableOpacity
    style={styles.recentItem}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <Image
      source={{ uri: item.poster_path }}
      style={styles.recentPoster}
      resizeMode="cover"
    />
    <View style={styles.recentInfo}>
      <Text style={styles.recentTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.recentMeta}>
        {item.media_type === "tv" ? "Series" : "Movie"}
      </Text>
    </View>
    <TouchableOpacity 
      onPress={() => onDelete(item)}
      style={styles.recentDeleteBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="close" size={18} color="#888" />
    </TouchableOpacity>
  </TouchableOpacity>
));

const SearchContent = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownResults, setDropdownResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading recent searches:", error);
        return;
      }

      if (data) {
        setRecentSearches(data);
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveToHistory = async (item) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing entry if it exists
      await supabase
        .from("search_history")
        .delete()
        .eq("user_id", user.id)
        .eq("title_id", item.id)
        .eq("media_type", item.type);

      // Insert new entry
      const { error } = await supabase
        .from("search_history")
        .insert({
          user_id: user.id,
          title_id: item.id,
          title: item.title,
          poster_path: item.image,
          media_type: item.type,
          year: item.year,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error saving to history:", error);
      } else {
        // Reload recent searches
        loadRecentSearches();
      }
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const deleteFromHistory = async (item) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from Supabase
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("user_id", user.id)
        .eq("title_id", item.title_id)
        .eq("media_type", item.media_type);

      if (error) {
        console.error("Error deleting from history:", error);
      } else {
        // Update local state
        setRecentSearches(recentSearches.filter(search => 
          !(search.title_id === item.title_id && search.media_type === item.media_type)
        ));
      }
    } catch (error) {
      console.error("Error deleting from history:", error);
    }
  };

  // Debounced search for dropdown
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setDropdownResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchContent(searchQuery);
        setDropdownResults(results.slice(0, 8)); // Show top 8 results
      } catch (error) {
        console.error("Search error:", error);
        setDropdownResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    // Delay to allow dropdown clicks
    setTimeout(() => {
      if (searchQuery.length === 0) {
        setIsFocused(false);
        setShowDropdown(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, 200);
  };

  const handleGenrePress = useCallback((genre) => {
    navigation.navigate("CategoryContent", {
      title: genre.name,
      categoryId: `genre_${genre.id}`,
      categoryType: "mixed",
      genreIds: { movie: genre.movieGenreId, tv: genre.tvGenreId },
    });
  }, [navigation]);

  const handleDropdownItemPress = useCallback((item) => {
    // Save to history
    saveToHistory(item);
    // Clear search and dropdown
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.blur();
    // Navigate to details
    navigation.navigate("ShowDetails", { show: item });
  }, [navigation]);

  const handleRecentSearchPress = useCallback((item) => {
    // Navigate to details
    const show = {
      id: item.title_id,
      title: item.title,
      image: item.poster_path,
      type: item.media_type,
      year: item.year,
    };
    navigation.navigate("ShowDetails", { show });
  }, [navigation]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setDropdownResults([]);
    setShowDropdown(false);
  }, []);

  const renderGenreItem = useCallback(({ item }) => (
    <GenreCard genre={item} onPress={handleGenrePress} />
  ), [handleGenrePress]);

  const renderDropdownItem = useCallback(({ item }) => (
    <DropdownItem item={item} onPress={handleDropdownItemPress} />
  ), [handleDropdownItemPress]);

  const renderRecentItem = useCallback(({ item }) => (
    <RecentSearchItem 
      item={item} 
      onPress={handleRecentSearchPress}
      onDelete={deleteFromHistory}
    />
  ), [handleRecentSearchPress]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search by actor, title.."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
        </View>

        {/* Dropdown Results */}
        {showDropdown && searchQuery.length > 0 && (
          <View style={styles.dropdown}>
            {isSearching ? (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator size="small" color="#37d1e4" />
              </View>
            ) : dropdownResults.length > 0 ? (
              <FlatList
                data={dropdownResults}
                renderItem={renderDropdownItem}
                keyExtractor={(item) => `dropdown-${item.type}-${item.id}`}
                showsVerticalScrollIndicator={false}
                style={styles.dropdownList}
              />
            ) : (
              <View style={styles.dropdownEmpty}>
                <Text style={styles.dropdownEmptyText}>No results found</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {isFocused && searchQuery.length === 0 ? (
        // Recent Searches
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentItem}
                keyExtractor={(item) => `recent-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.recentList}
              />
            </>
          )}
        </View>
      ) : (
        // Genres Grid
        <Animated.View style={[styles.genresContainer, { opacity: fadeAnim }]}>
          <Text style={styles.genresTitle}>Browse by Genre</Text>
          <FlatList
            data={GENRES}
            renderItem={renderGenreItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.genresList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            numColumns={2}
            columnWrapperStyle={styles.genreRow}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010e1f",
    paddingTop: 80,
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
    position: "relative",
    zIndex: 1000,
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
  },
  dropdown: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: "#1a2332",
    borderRadius: 8,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0a1929",
  },
  dropdownPoster: {
    width: 70,
    height: 105,
    borderRadius: 4,
    backgroundColor: "#0a1929",
  },
  dropdownInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dropdownTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  dropdownMeta: {
    color: "#888",
    fontSize: 12,
  },
  dropdownLoading: {
    padding: 20,
    alignItems: "center",
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: "center",
  },
  dropdownEmptyText: {
    color: "#888",
    fontSize: 14,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  recentTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  recentList: {
    paddingBottom: 100,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2332",
  },
  recentPoster: {
    width: 70,
    height: 105,
    borderRadius: 4,
    backgroundColor: "#0a1929",
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentMeta: {
    color: "#888",
    fontSize: 13,
  },
  recentDeleteBtn: {
    padding: 8,
  },
  genresContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  genresTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  genresList: {
    paddingBottom: 100,
  },
  genreRow: {
    justifyContent: "space-between",
  },
  genreCard: {
    width: (width - 36) / 2,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: 6,
    backgroundColor: "#0a1929",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  genreImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  genreGradient: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  genreCardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default SearchContent;
