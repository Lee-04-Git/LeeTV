import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

// Netflix colors
const NETFLIX_RED = "#E50914";
const NETFLIX_BLACK = "#141414";

// Max colors
const MAX_PURPLE = "#5822B4";
const MAX_DARK = "#0D0D0D";

// Apple TV+ colors
const APPLE_BLACK = "#000000";
const APPLE_BLUE = "#0A84FF";

// Disney+ colors
const DISNEY_DARK = "#0E0B14";
const DISNEY_BLUE = "#0063E5";

// Paramount+ colors
const PARAMOUNT_DARK = "#06121E";
const PARAMOUNT_BLUE = "#0064FF";

// ESPN colors
const ESPN_RED = "#D00000";
const ESPN_DARK = "#121212";

// USA Network colors
const USA_BLUE = "#0033A0";
const USA_GOLD = "#FFB81C";
const USA_DARK = "#0A0A0A";

// The CW colors
const CW_GREEN = "#00B140";
const CW_DARK = "#000000";

const MovieItem = memo(({ item, onPress, isNetflix, isMax, isApple, isDisney, isParamount, isESPN, isUSA, isCW }) => (
  <TouchableOpacity style={[styles.itemCard, isMax && styles.maxItemCard, isApple && styles.appleItemCard, isDisney && styles.disneyItemCard, isParamount && styles.paramountItemCard, isESPN && styles.espnItemCard, isUSA && styles.usaItemCard, isCW && styles.cwItemCard]} onPress={() => onPress(item)} activeOpacity={0.8}>
    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
    {!isNetflix && !isMax && !isApple && !isDisney && !isParamount && !isESPN && !isUSA && !isCW && (
      <View style={styles.itemOverlay}>
        <View style={styles.itemRating}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={styles.itemRatingText}>{item.rating}</Text>
        </View>
      </View>
    )}
    {isNetflix && item.rating >= 8 && (
      <View style={styles.netflixBadge}>
        <Text style={styles.netflixBadgeText}>TOP</Text>
      </View>
    )}
    {isMax && item.rating >= 8 && (
      <View style={styles.maxBadge}>
        <Text style={styles.maxBadgeText}>MAX</Text>
      </View>
    )}
    {isApple && item.rating >= 8 && (
      <View style={styles.appleBadge}>
        <Ionicons name="star-sharp" size={8} color="#FFD700" />
      </View>
    )}
    {isParamount && item.rating >= 8 && (
      <View style={styles.paramountBadge}>
        <Ionicons name="star" size={8} color="#FFD700" />
      </View>
    )}
    {isESPN && item.rating >= 8 && (
      <View style={styles.espnBadge}>
        <Text style={styles.espnBadgeText}>ESPN+</Text>
      </View>
    )}
    {isUSA && item.rating >= 7.5 && (
      <View style={styles.usaBadge}>
        <Text style={styles.usaBadgeText}>USA</Text>
      </View>
    )}
    {isCW && item.rating >= 7 && (
      <View style={styles.cwBadge}>
        <Text style={styles.cwBadgeText}>CW</Text>
      </View>
    )}
  </TouchableOpacity>
));

const FranchiseCategoryScreen = ({ route, navigation }) => {
  const { title, data, franchise } = route.params;
  const isNetflix = franchise === "Netflix" || franchise === "Netflix Originals";
  const isMax = franchise === "HBO Max" || franchise === "Max";
  const isApple = franchise === "Apple TV+";
  const isDisney = franchise === "Disney+" || franchise === "Disney";
  const isParamount = franchise === "Paramount+";
  const isESPN = franchise === "ESPN";
  const isUSA = franchise === "USA Network";
  const isCW = franchise === "The CW";

  const handleShowPress = (item) => {
    navigation.navigate("ShowDetails", { show: item });
  };

  const renderItem = ({ item }) => (
    <MovieItem item={item} onPress={handleShowPress} isNetflix={isNetflix} isMax={isMax} isApple={isApple} isDisney={isDisney} isParamount={isParamount} isESPN={isESPN} isUSA={isUSA} isCW={isCW} />
  );

  return (
    <View style={[styles.container, isNetflix && styles.netflixContainer, isMax && styles.maxContainer, isApple && styles.appleContainer, isDisney && styles.disneyContainer, isParamount && styles.paramountContainer, isESPN && styles.espnContainer, isUSA && styles.usaContainer, isCW && styles.cwContainer]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView edges={["top"]} style={[styles.safeArea, isNetflix && styles.netflixSafeArea, isMax && styles.maxSafeArea, isApple && styles.appleSafeArea, isDisney && styles.disneySafeArea, isParamount && styles.paramountSafeArea, isESPN && styles.espnSafeArea, isUSA && styles.usaSafeArea, isCW && styles.cwSafeArea]}>
        <View style={[styles.header, isNetflix && styles.netflixHeader, isMax && styles.maxHeader, isApple && styles.appleHeader, isDisney && styles.disneyHeader, isParamount && styles.paramountHeader, isESPN && styles.espnHeader, isUSA && styles.usaHeader, isCW && styles.cwHeader]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name={(isApple || isDisney) ? "chevron-back" : "arrow-back"} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            {!isNetflix && !isMax && !isApple && !isDisney && !isParamount && !isESPN && !isUSA && !isCW && <Text style={styles.headerSubtitle}>{franchise}</Text>}
            {isApple && (
              <View style={styles.appleLogoRow}>
                <Ionicons name="logo-apple" size={16} color="#fff" />
                <Text style={styles.appleTvText}>tv+</Text>
              </View>
            )}
            {isDisney && <Text style={styles.disneySubtitle}>Disney+</Text>}
            {isParamount && <Text style={styles.paramountSubtitle}>Paramount+</Text>}
            {isESPN && <Text style={styles.espnSubtitle}>ESPN+</Text>}
            {isUSA && <Text style={styles.usaSubtitle}>USA Network</Text>}
            {isCW && <Text style={styles.cwSubtitle}>The CW</Text>}
            <Text style={[styles.headerTitle, isNetflix && styles.netflixHeaderTitle, isMax && styles.maxHeaderTitle, isApple && styles.appleHeaderTitle, isDisney && styles.disneyHeaderTitle, isParamount && styles.paramountHeaderTitle, isESPN && styles.espnHeaderTitle, isUSA && styles.usaHeaderTitle, isCW && styles.cwHeaderTitle]} numberOfLines={1}>{title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.countText, isApple && styles.appleCountText]}>{data?.length || 0} titles</Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}-${item.type}`}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No content found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010e1f" },
  netflixContainer: { backgroundColor: NETFLIX_BLACK },
  maxContainer: { backgroundColor: MAX_DARK },
  appleContainer: { backgroundColor: APPLE_BLACK },
  disneyContainer: { backgroundColor: DISNEY_DARK },
  paramountContainer: { backgroundColor: PARAMOUNT_DARK },
  espnContainer: { backgroundColor: ESPN_DARK },
  usaContainer: { backgroundColor: USA_DARK },
  safeArea: { backgroundColor: "#010e1f" },
  netflixSafeArea: { backgroundColor: NETFLIX_BLACK },
  maxSafeArea: { backgroundColor: MAX_DARK },
  appleSafeArea: { backgroundColor: APPLE_BLACK },
  disneySafeArea: { backgroundColor: DISNEY_DARK },
  paramountSafeArea: { backgroundColor: PARAMOUNT_DARK },
  espnSafeArea: { backgroundColor: ESPN_DARK },
  usaSafeArea: { backgroundColor: USA_DARK },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1a3a5c",
  },
  netflixHeader: { borderBottomColor: "#333" },
  maxHeader: { borderBottomColor: "#222" },
  appleHeader: { borderBottomColor: "#222" },
  disneyHeader: { borderBottomColor: "#1F2937" },
  paramountHeader: { borderBottomColor: "#0A1628" },
  espnHeader: { borderBottomColor: "#1E1E1E" },
  usaHeader: { borderBottomColor: "#1A1A1A" },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitleContainer: { flex: 1 },
  headerSubtitle: { color: "#37d1e4", fontSize: 11, fontWeight: "600", marginBottom: 2 },
  disneySubtitle: { color: DISNEY_BLUE, fontSize: 11, fontWeight: "600", marginBottom: 2 },
  paramountSubtitle: { color: PARAMOUNT_BLUE, fontSize: 11, fontWeight: "600", marginBottom: 2 },
  espnSubtitle: { color: ESPN_RED, fontSize: 11, fontWeight: "800", marginBottom: 2 },
  usaSubtitle: { color: USA_GOLD, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  appleLogoRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  appleTvText: { color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 2 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  netflixHeaderTitle: { fontSize: 20 },
  maxHeaderTitle: { fontSize: 20 },
  appleHeaderTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  disneyHeaderTitle: { fontSize: 20, fontWeight: "700" },
  paramountHeaderTitle: { fontSize: 20, fontWeight: "700" },
  espnHeaderTitle: { fontSize: 20, fontWeight: "800" },
  usaHeaderTitle: { fontSize: 20, fontWeight: "700" },
  headerRight: { marginLeft: 12 },
  countText: { color: "#888", fontSize: 13 },
  appleCountText: { color: "#8E8E93" },
  gridContent: { padding: 16, paddingBottom: 32 },
  itemCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  maxItemCard: { borderRadius: 6 },
  appleItemCard: { borderRadius: 10, backgroundColor: "#1C1C1E" },
  disneyItemCard: { borderRadius: 8, backgroundColor: "#1F2937", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  paramountItemCard: { borderRadius: 6, backgroundColor: "#0A1628" },
  espnItemCard: { borderRadius: 6, backgroundColor: "#1E1E1E" },
  usaItemCard: { borderRadius: 6, backgroundColor: "#1A1A1A" },
  itemImage: { width: "100%", height: "100%" },
  itemOverlay: { position: "absolute", top: 6, right: 6 },
  itemRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  itemRatingText: { color: "#FFD700", fontSize: 10, fontWeight: "700" },
  netflixBadge: { position: "absolute", top: 4, left: 4, backgroundColor: NETFLIX_RED, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  netflixBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  maxBadge: { position: "absolute", top: 4, left: 4, backgroundColor: MAX_PURPLE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  maxBadgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  appleBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.6)", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  paramountBadge: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.6)", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  espnBadge: { position: "absolute", top: 4, left: 4, backgroundColor: ESPN_RED, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  espnBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  usaBadge: { position: "absolute", top: 4, left: 4, backgroundColor: USA_BLUE, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  usaBadgeText: { color: "#fff", fontSize: 8, fontWeight: "700" },
  cwContainer: { backgroundColor: CW_DARK },
  cwSafeArea: { backgroundColor: CW_DARK },
  cwHeader: { borderBottomColor: "#1A1A1A" },
  cwSubtitle: { color: CW_GREEN, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  cwHeaderTitle: { fontSize: 20, fontWeight: "700" },
  cwItemCard: { borderRadius: 6, backgroundColor: "#1A1A1A" },
  cwBadge: { position: "absolute", top: 4, left: 4, backgroundColor: CW_GREEN, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  cwBadgeText: { color: "#fff", fontSize: 8, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { color: "#888", fontSize: 16, marginTop: 16 },
});

export default FranchiseCategoryScreen;
