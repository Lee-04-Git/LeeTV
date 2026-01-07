import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../constants/colors";
import { useMyList } from "../context/MyListContext";
import { PlayIcon, StarIcon, DownloadIcon, CheckIcon } from "../components/Icons";

const { width } = Dimensions.get("window");

const MyListScreen = ({ navigation }) => {
  const { myList } = useMyList();
  const [selectedTab, setSelectedTab] = useState("Movies");

  // Dummy data for movies in My List
  const dummyMovies = [
    {
      id: "mylist-movie-1",
      title: "The Irishman",
      image: "https://placehold.co/300x450/2C3E50/FFFFFF?text=The+Irishman",
      type: "movie",
      rating: 8.7,
    },
    {
      id: "mylist-movie-2",
      title: "Extraction",
      image: "https://placehold.co/300x450/34495E/FFFFFF?text=Extraction",
      type: "movie",
      rating: 6.8,
    },
    {
      id: "mylist-movie-3",
      title: "The Old Guard",
      image: "https://placehold.co/300x450/5D6D7E/FFFFFF?text=The+Old+Guard",
      type: "movie",
      rating: 7.2,
    },
    {
      id: "mylist-movie-4",
      title: "Enola Holmes",
      image: "https://placehold.co/300x450/7B8794/FFFFFF?text=Enola+Holmes",
      type: "movie",
      rating: 7.6,
    },
  ];

  // Dummy data for TV shows in My List
  const dummyTvShows = [
    {
      id: "mylist-tv-1",
      title: "Money Heist",
      image: "https://placehold.co/300x450/C0392B/FFFFFF?text=Money+Heist",
      type: "tv",
      rating: 8.5,
    },
    {
      id: "mylist-tv-2",
      title: "Stranger Things",
      image: "https://placehold.co/300x450/E74C3C/FFFFFF?text=Stranger+Things",
      type: "tv",
      rating: 8.7,
    },
    {
      id: "mylist-tv-3",
      title: "The Crown",
      image: "https://placehold.co/300x450/EC7063/FFFFFF?text=The+Crown",
      type: "tv",
      rating: 8.6,
    },
    {
      id: "mylist-tv-4",
      title: "Dark",
      image: "https://placehold.co/300x450/F1948A/FFFFFF?text=Dark",
      type: "tv",
      rating: 8.8,
    },
  ];

  // Continue Watching dummy data
  const continueWatchingList = [
    {
      id: "continue-1",
      title: "Stranger Things",
      episode: "S4 E5 • The Nina Project",
      image: "https://placehold.co/400x225/E74C3C/FFFFFF?text=Stranger+Things",
      progress: 65,
      type: "tv",
    },
    {
      id: "continue-2",
      title: "Breaking Bad",
      episode: "S3 E7 • One Minute",
      image: "https://placehold.co/400x225/27AE60/FFFFFF?text=Breaking+Bad",
      progress: 42,
      type: "tv",
    },
    {
      id: "continue-3",
      title: "The Witcher",
      episode: "S2 E3 • What Is Lost",
      image: "https://placehold.co/400x225/8E44AD/FFFFFF?text=The+Witcher",
      progress: 88,
      type: "tv",
    },
  ];

  // Filter content by selected tab
  const displayedContent =
    selectedTab === "Movies" ? dummyMovies : dummyTvShows;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.95)", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0)"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>My List</Text>
              <Text style={styles.subtitle}>
                {myList.length} {myList.length === 1 ? "title" : "titles"} saved
              </Text>
            </View>
            <TouchableOpacity style={styles.downloadAllButton}>
              <DownloadIcon size={22} color={colors.white} />
              <Text style={styles.downloadAllText}>All</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Tab System */}
          <View style={styles.tabContainer}>
            {["Movies", "TV Shows"].map((tab) => (
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
                {selectedTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Continue Watching Section */}
        {continueWatchingList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Watching</Text>
              <Text style={styles.sectionCount}>{continueWatchingList.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {continueWatchingList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.continueCard}
                  onPress={() =>
                    navigation.navigate("ShowDetails", { show: item })
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.continueImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.continueImage}
                    />
                    
                    {/* Dark overlay with gradient */}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.75)"]}
                      style={styles.continueGradientOverlay}
                    >
                      <View style={styles.episodeOverlayInfo}>
                        <Text style={styles.episodeNumber}>{item.episode}</Text>
                      </View>
                    </LinearGradient>

                    {/* Play Button Overlay */}
                    <View style={styles.continueOverlay}>
                      <View style={styles.playButtonCircle}>
                        <PlayIcon size={26} color={colors.black} />
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${item.progress}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.continueInfo}>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.continueEpisode}>{item.episode}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* My List Grid Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              My {selectedTab === "Movies" ? "Movies" : "TV Shows"}
            </Text>
            <Text style={styles.sectionCount}>{displayedContent.length}</Text>
          </View>

          {displayedContent.length === 0 ? (
            <View style={styles.emptySection}>
              <View style={styles.emptyIconContainer}>
                <CheckIcon size={44} color={colors.gray} />
              </View>
              <Text style={styles.emptyText}>
                No {selectedTab === "Movies" ? "movies" : "shows"} yet
              </Text>
              <Text style={styles.emptySubtext}>
                Start adding {selectedTab === "Movies" ? "movies" : "shows"} to
                build your collection
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {displayedContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("ShowDetails", { show: item })
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                    
                    {/* Gradient Overlay on Image */}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.9)"]}
                      style={styles.cardGradientOverlay}
                    >
                      <View style={styles.cardBottomInfo}>
                        <View style={styles.ratingBadge}>
                          <StarIcon size={11} color="#FFD700" />
                          <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Hover Play Button */}
                    <View style={styles.cardOverlay}>
                      <View style={styles.playButtonSmall}>
                        <PlayIcon size={22} color={colors.black} />
                      </View>
                    </View>

                    {/* Top Badge - In List Indicator */}
                    <View style={styles.topBadgeContainer}>
                      <View style={styles.inListBadge}>
                        <CheckIcon size={11} color={colors.white} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  backButton: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "600",
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.lightGray,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  downloadAllText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 32,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tab: {
    position: "relative",
    paddingVertical: 14,
  },
  activeTab: {
    // Active state handled by indicator
  },
  tabText: {
    color: colors.gray,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  activeTabText: {
    color: colors.white,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.netflixRed,
    borderRadius: 2,
  },
  section: {
    marginTop: 34,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  sectionCount: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    letterSpacing: 0.3,
  },
  horizontalList: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  continueCard: {
    marginRight: 18,
    borderRadius: 10,
    overflow: "hidden",
    width: 360,
    backgroundColor: colors.cardBackground,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  continueImageContainer: {
    position: "relative",
  },
  continueImage: {
    width: 360,
    height: 200,
  },
  continueGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  episodeOverlayInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  episodeNumber: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  continueOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  progressBar: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 0,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.netflixRed,
    borderRadius: 0,
  },
  continueInfo: {
    padding: 16,
  },
  continueTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  continueEpisode: {
    color: colors.lightGray,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 70,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  emptySubtext: {
    color: colors.lightGray,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 5,
  },
  card: {
    width: width > 600 ? "23%" : "31%",
    marginHorizontal: width > 600 ? "1%" : "1.16%",
    marginBottom: 32,
  },
  cardImageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.cardBackground,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  image: {
    width: "100%",
    aspectRatio: 2 / 3,
  },
  cardGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  cardBottomInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  playButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  topBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  inListBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(70, 211, 105, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  itemTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingText: {
    color: colors.lightGray,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default MyListScreen;
