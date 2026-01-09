import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import colors from "../constants/colors";
import { BackIcon } from "../components/Icons";
import {
  fetchFranchiseContent,
  fetchAnime,
  fetchNetflix,
  fetchHulu,
  fetchDC,
  fetchMarvel,
  fetchStarWars,
  fetchHBOMax,
  fetchParamountPlus,
  fetchAppleTV,
  fetchUSANetwork,
  fetchTheCW,
  fetchESPN,
  fetchStructuredFranchiseContent,
} from "../services/tmdbApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FranchiseScreen = ({ navigation, route }) => {
  const { franchise } = route.params || {};
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");

  // Structured content state for row-based layout
  const [structuredContent, setStructuredContent] = useState(null);
  const [useStructuredLayout, setUseStructuredLayout] = useState(false);

  // Pagination state for lazy loading franchises
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedContent, setPaginatedContent] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [targetCount, setTargetCount] = useState(500);

  // Franchises that support structured row layout
  const structuredFranchises = [
    "Marvel",
    "Star Wars",
    "DC",
    "Disney",
    "Disney+",
    "Netflix",
    "Netflix Originals",
    "HBO Max",
    "Max",
    "Anime",
  ];

  // Check if franchise uses structured layout
  const supportsStructuredLayout = structuredFranchises.includes(franchise);

  // Check if franchise uses lazy loading (for non-structured franchises)
  const usesLazyLoading =
    !supportsStructuredLayout &&
    (franchise === "Hulu" ||
      franchise === "Paramount+" ||
      franchise === "Apple TV+" ||
      franchise === "USA Network" ||
      franchise === "The CW" ||
      franchise === "ESPN");

  useEffect(() => {
    if (supportsStructuredLayout) {
      loadStructuredContent();
    } else if (usesLazyLoading) {
      loadPaginatedContent(1, true);
    } else {
      loadFranchiseContent();
    }
  }, [franchise]);

  const loadStructuredContent = async () => {
    setLoading(true);
    try {
      const content = await fetchStructuredFranchiseContent(franchise);
      if (content && content.sections && content.sections.length > 0) {
        setStructuredContent(content);
        setUseStructuredLayout(true);
      } else {
        // Fallback to paginated loading if structured content fails
        loadPaginatedContent(1, true);
      }
    } catch (error) {
      console.error("Error loading structured content:", error);
      loadPaginatedContent(1, true);
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedContent = async (page, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setPaginatedContent([]);
      setCurrentPage(1);
      setHasMore(true);
      setUseStructuredLayout(false);
      // Set target count based on franchise
      if (franchise === "Hulu") {
        setTargetCount(200);
      } else if (franchise === "Paramount+") {
        setTargetCount(150);
      } else if (franchise === "Apple TV+") {
        setTargetCount(233);
      } else if (franchise === "USA Network") {
        setTargetCount(166);
      } else if (franchise === "The CW") {
        setTargetCount(182);
      } else if (franchise === "ESPN") {
        setTargetCount(102);
      } else {
        setTargetCount(500);
      }
    } else {
      setLoadingMore(true);
    }

    try {
      let data;
      if (franchise === "Hulu") {
        data = await fetchHulu(page);
      } else if (franchise === "Paramount+") {
        data = await fetchParamountPlus(page);
      } else if (franchise === "Apple TV+") {
        data = await fetchAppleTV(page);
      } else if (franchise === "USA Network") {
        data = await fetchUSANetwork(page);
      } else if (franchise === "The CW") {
        data = await fetchTheCW(page);
      } else if (franchise === "ESPN") {
        data = await fetchESPN(page);
      }

      if (data) {
        if (isInitial) {
          setPaginatedContent(data.results);
        } else {
          setPaginatedContent((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = data.results.filter(
              (item) => !existingIds.has(item.id)
            );
            return [...prev, ...newItems];
          });
        }

        let maxCount = 500;
        if (franchise === "Hulu") {
          maxCount = 200;
        } else if (franchise === "Paramount+") {
          maxCount = 150;
        } else if (franchise === "Apple TV+") {
          maxCount = 233;
        } else if (franchise === "USA Network") {
          maxCount = 166;
        } else if (franchise === "The CW") {
          maxCount = 182;
        } else if (franchise === "ESPN") {
          maxCount = 102;
        }
        setHasMore(page < data.totalPages && paginatedContent.length < maxCount);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error(`Error loading ${franchise} content:`, error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFranchiseContent = async () => {
    setLoading(true);
    try {
      const { movies, tvShows } = await fetchFranchiseContent(franchise);
      setMovies(movies);
      setTVShows(tvShows);
    } catch (error) {
      console.error("Error loading franchise content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (usesLazyLoading && !loadingMore && hasMore && !useStructuredLayout) {
      loadPaginatedContent(currentPage + 1, false);
    }
  }, [usesLazyLoading, loadingMore, hasMore, currentPage, useStructuredLayout]);

  const getDisplayContent = () => {
    if (useStructuredLayout) {
      return []; // Structured layout uses sections, not flat list
    }
    if (usesLazyLoading) {
      return paginatedContent;
    }
    if (selectedTab === "Movies") return movies;
    if (selectedTab === "TV Shows") return tvShows;
    return [...movies, ...tvShows];
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", {
      show: item,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleContentPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardYear}>{item.year}</Text>
          <Text style={styles.cardRating}>⭐ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Row item for structured layout
  const renderRowItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rowCard}
      onPress={() => handleContentPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.rowPoster}
        resizeMode="cover"
      />
      <Text style={styles.rowCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  // Section component for structured layout
  const renderSection = (section) => (
    <View key={section.id} style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <FlatList
        data={section.data}
        renderItem={renderRowItem}
        keyExtractor={(item) => `${section.id}-${item.type}-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{franchise || "Franchise"}</Text>
        {usesLazyLoading && !useStructuredLayout && (
          <Text style={styles.countText}>{paginatedContent.length} titles</Text>
        )}
      </View>

      {/* Tab Selector - hide for lazy loading and structured franchises */}
      {!usesLazyLoading && !useStructuredLayout && (
        <View style={styles.tabContainer}>
          {["All", "Movies", "TV Shows"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading {franchise} content...</Text>
        </View>
      ) : useStructuredLayout && structuredContent ? (
        // Structured row-based layout
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.structuredContent}
        >
          {structuredContent.sections.map(renderSection)}
        </ScrollView>
      ) : (
        // Grid layout for non-structured franchises
        <FlatList
          data={getDisplayContent()}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={4}
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedTab.toLowerCase()} content available for {franchise}
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
    flex: 1,
  },
  countText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.white,
    marginTop: 15,
    fontSize: 16,
  },
  // Grid layout styles
  flatListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  card: {
    width: "23%",
    marginHorizontal: "1%",
    marginBottom: 16,
  },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardInfo: {
    marginTop: 6,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardYear: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
  },
  cardRating: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  // Structured row layout styles
  scrollView: {
    flex: 1,
  },
  structuredContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rowContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  rowCard: {
    width: 120,
    marginRight: 10,
  },
  rowPoster: {
    width: 120,
    height: 180,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  rowCardTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
});

export default FranchiseScreen;
