import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import colors from "../constants/colors";
import { fetchFranchiseContent } from "../services/tmdbApi";

const FranchiseScreen = ({ navigation, route }) => {
  const { franchise } = route.params || {};
  const [movies, setMovies] = useState([]);
  const [tvShows, setTVShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");

  useEffect(() => {
    loadFranchiseContent();
  }, [franchise]);

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

  const getDisplayContent = () => {
    if (selectedTab === "Movies") return movies;
    if (selectedTab === "TV Shows") return tvShows;
    return [...movies, ...tvShows];
  };

  const handleContentPress = (item) => {
    navigation.navigate("ShowDetails", {
      show: item,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{franchise || "Franchise"}</Text>
      </View>

      {/* Tab Selector */}
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading {franchise} content...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.grid}>
            {getDisplayContent().map((item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                style={styles.card}
                onPress={() => handleContentPress(item)}
              >
                <Image source={{ uri: item.image }} style={styles.poster} />
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
            ))}
          </View>
          {getDisplayContent().length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedTab.toLowerCase()} content available for {franchise}
              </Text>
            </View>
          )}
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 20,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
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
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  card: {
    width: "31%",
    marginHorizontal: "1.16%",
    marginBottom: 20,
  },
  poster: {
    width: "100%",
    height: 170,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardInfo: {
    marginTop: 8,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardYear: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
  },
  cardRating: {
    color: colors.primary,
    fontSize: 11,
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
});

export default FranchiseScreen;
