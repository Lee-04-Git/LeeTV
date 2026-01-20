import React, { useState, useEffect, memo } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategoryContent } from "../services/tmdbApi";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

const MovieItem = memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item)} activeOpacity={0.8}>
    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
    <View style={styles.itemOverlay}>
      <Text style={styles.itemRating}>
        <Ionicons name="star" size={10} color="#FFD700" /> {item.rating}
      </Text>
    </View>
  </TouchableOpacity>
));

const CategoryContentScreen = ({ route, navigation }) => {
  const { title, categoryId, categoryType } = route.params;
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await fetchCategoryContent(categoryId, categoryType, 1, 25);
      setContent(data.results);
      setHasMore(data.hasMore);
      setPage(1);
    } catch (error) {
      console.error("Error loading category content:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchCategoryContent(categoryId, categoryType, nextPage, 25);
      setContent(prev => [...prev, ...data.results]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more content:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleShowPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const renderItem = ({ item }) => (
    <MovieItem item={item} onPress={handleShowPress} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#37d1e4" />
      </View>
    );
  };

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
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}-${item.type}`}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={64} color="#555" />
              <Text style={styles.emptyText}>No content found</Text>
            </View>
          }
        />
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
  gridContent: { padding: 16, paddingBottom: 32 },
  itemCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#0a1929",
  },
  itemImage: { width: "100%", height: "100%" },
  itemOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  itemRating: { color: "#fff", fontSize: 11, fontWeight: "600" },
  loadingMore: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { color: "#888", fontSize: 16, marginTop: 16 },
});

export default CategoryContentScreen;
