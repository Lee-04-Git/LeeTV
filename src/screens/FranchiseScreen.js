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
} from "../services/tmdbApi";

const FranchiseScreen = ({ navigation, route }) => {
  const { franchise } = route.params || {};
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");

  // Pagination state for lazy loading franchises
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedContent, setPaginatedContent] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [targetCount, setTargetCount] = useState(500);

  // Check if franchise uses lazy loading
  const usesLazyLoading =
    franchise === "Anime" ||
    franchise === "Netflix" ||
    franchise === "Netflix Originals" ||
    franchise === "Hulu" ||
    franchise === "DC" ||
    franchise === "Marvel" ||
    franchise === "Star Wars" ||
    franchise === "HBO Max" ||
    franchise === "Max" ||
    franchise === "Paramount+" ||
    franchise === "Apple TV+" ||
    franchise === "USA Network" ||
    franchise === "The CW" ||
    franchise === "ESPN";

  useEffect(() => {
    if (usesLazyLoading) {
      loadPaginatedContent(1, true);
    } else {
      loadFranchiseContent();
    }
  }, [franchise]);

  const loadPaginatedContent = async (page, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setPaginatedContent([]);
      setCurrentPage(1);
      setHasMore(true);
      // Set target count based on franchise
      if (franchise === "Netflix" || franchise === "Netflix Originals") {
        setTargetCount(300);
      } else if (franchise === "Hulu") {
        setTargetCount(200);
      } else if (franchise === "DC") {
        setTargetCount(112); // All available DC content (~76 movies + 36 TV)
      } else if (franchise === "Marvel") {
        setTargetCount(170); // All available Marvel content (~124 movies + 46 TV)
      } else if (franchise === "Star Wars") {
        setTargetCount(295); // All available Star Wars content (~233 movies + 62 TV)
      } else if (franchise === "HBO Max" || franchise === "Max") {
        setTargetCount(200); // HBO Max content
      } else if (franchise === "Paramount+") {
        setTargetCount(150); // Paramount+ content (~135 available)
      } else if (franchise === "Apple TV+") {
        setTargetCount(233); // Apple TV+ content (~233 available)
      } else if (franchise === "USA Network") {
        setTargetCount(166); // USA Network content (~166 available)
      } else if (franchise === "The CW") {
        setTargetCount(182); // The CW content (~182 available)
      } else if (franchise === "ESPN") {
        setTargetCount(102); // ESPN content (~102 available)
      } else {
        setTargetCount(500);
      }
    } else {
      setLoadingMore(true);
    }

    try {
      let data;
      if (franchise === "Anime") {
        data = await fetchAnime(page);
      } else if (franchise === "Netflix" || franchise === "Netflix Originals") {
        data = await fetchNetflix(page);
      } else if (franchise === "Hulu") {
        data = await fetchHulu(page);
      } else if (franchise === "DC") {
        data = await fetchDC(page);
      } else if (franchise === "Marvel") {
        data = await fetchMarvel(page);
      } else if (franchise === "Star Wars") {
        data = await fetchStarWars(page);
      } else if (franchise === "HBO Max" || franchise === "Max") {
        data = await fetchHBOMax(page);
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
      if (franchise === "Netflix" || franchise === "Netflix Originals") {
        maxCount = 300;
      } else if (franchise === "Hulu") {
        maxCount = 200;
      } else if (franchise === "DC") {
        maxCount = 112;
      } else if (franchise === "HBO Max" || franchise === "Max") {
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
      } else if (franchise === "Marvel") {
        maxCount = 170;
      } else if (franchise === "Star Wars") {
        maxCount = 295;
      }
      setHasMore(page < data.totalPages && paginatedContent.length < maxCount);
      setCurrentPage(page);
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
    if (usesLazyLoading && !loadingMore && hasMore) {
      loadPaginatedContent(currentPage + 1, false);
    }
  }, [usesLazyLoading, loadingMore, hasMore, currentPage]);

  const getDisplayContent = () => {
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
        {usesLazyLoading && (
          <Text style={styles.countText}>{paginatedContent.length} titles</Text>
        )}
      </View>

      {/* Tab Selector - hide for lazy loading franchises since they're all TV */}
      {!usesLazyLoading && (
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
      ) : (
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
});

export default FranchiseScreen;
