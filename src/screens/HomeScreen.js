import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchTrending,
  fetchTrendingTVShows,
  fetchTrendingMovies,
  fetchPopularMovies,
  fetchPopularTVShows,
  fetchTopRatedMovies,
  fetchTopRatedTVShows,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  fetchAiringTodayTVShows,
  fetchOnTheAirTVShows,
  fetchMoviesByGenre,
  fetchTVShowsByGenre,
  fetchAnime,
  fetchTop10ThisWeek,
  fetchUpcomingEpisodes,
  fetchSplitHeroTitles,
  fetchRandomPick,
} from "../services/tmdbApi";
import { SkeletonRow } from "../components/SkeletonLoader";
import { getUserList, addToList, removeFromList, isInList, getContinueWatching } from "../services/supabaseService";

const { width, height } = Dimensions.get("window");

const TABS = [
  { id: "Home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "TV Shows", label: "TV Shows", icon: "tv-outline", activeIcon: "tv" },
  { id: "Movies", label: "Movies", icon: "film-outline", activeIcon: "film" },
  { id: "Live TV", label: "Live TV", icon: "radio-outline", activeIcon: "radio" },
  { id: "My List", label: "My List", icon: "list-outline", activeIcon: "list" },
];

const CONTENT_TABS = TABS;

const SECTIONS_CONFIG = {
  Home: [
    { title: "Anime", fn: fetchAnime, params: [1], id: "anime" },
  ],
  Movies: [
    { title: "Now Playing", fn: fetchNowPlayingMovies, params: [1], id: "now_playing" },
    { title: "Upcoming", fn: fetchUpcomingMovies, params: [1], id: "upcoming" },
    { title: "Top Rated Movies", fn: fetchTopRatedMovies, params: [2], id: "top_rated_movies" },
    { title: "Action", fn: fetchMoviesByGenre, params: [28, 1], id: "action" },
    { title: "Comedy", fn: fetchMoviesByGenre, params: [35, 1], id: "comedy" },
  ],
  "TV Shows": [
    { title: "Airing Today", fn: fetchAiringTodayTVShows, params: [1], id: "airing_today" },
    { title: "On The Air", fn: fetchOnTheAirTVShows, params: [1], id: "on_the_air" },
    { title: "Top Rated", fn: fetchTopRatedTVShows, params: [2], id: "top_rated_tv" },
    { title: "Drama", fn: fetchTVShowsByGenre, params: [18, 1], id: "drama" },
  ],
  "My List": [],
};

const FRANCHISE_ICONS = [
  { name: "Netflix", img: require("../../assets/netflix-icon-logo.jpg"), scale: 1.3 },
  { name: "Marvel", img: require("../../assets/marvel.png"), scale: 1 },
  { name: "Star Wars", img: require("../../assets/star-wars.png"), scale: 0.85 },
  { name: "Anime", img: require("../../assets/anime.png"), scale: 1 },
  { name: "DC", img: require("../../assets/dc.jpg"), scale: 1 },
  { name: "Disney", img: require("../../assets/new-disneyplus-icon.jpg"), scale: 1 },
  { name: "HBO Max", img: require("../../assets/max.jpg"), scale: 1 },
  { name: "Apple TV+", img: require("../../assets/apple-tv-icon-logo.jpg"), scale: 1.35 },
  { name: "Paramount+", img: require("../../assets/paramount-plus-logo-icon.png"), scale: 1 },
  { name: "Hulu", img: require("../../assets/hulu.png"), scale: 1 },
  { name: "USA Network", img: require("../../assets/usa-network-icon-logo.jpg"), scale: 1 },
  { name: "The CW", img: require("../../assets/cw-network-logo.png"), scale: 1.25 },
  { name: "ESPN", img: require("../../assets/espn-logo-icon.png"), scale: 1 },
  { name: "Harry Potter", textIcon: "HP", bgColor: "#1a1a2e", scale: 1 },
  { name: "Transformers", textIcon: "TF", bgColor: "#1a1a2e", scale: 1 },
];

const MovieItem = memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.showCard} onPress={() => onPress(item)} activeOpacity={0.8}>
    <Image source={{ uri: item.image }} style={styles.showImage} resizeMode="cover" />
  </TouchableOpacity>
));

const HorizontalList = memo(({ title, data, loading, onShowPress, navigation, categoryId, categoryType }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && data && data.length > 0) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading, data]);

  if (loading) return <SkeletonRow />;
  if (!data || data.length === 0) return null;

  const handleSeeAll = () => {
    if (navigation && categoryId) {
      navigation.navigate("CategoryContent", { 
        title, 
        categoryId, 
        categoryType: categoryType || 'mixed'
      });
    }
  };

  return (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <View style={styles.sectionHeader}>
        {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
        {navigation && categoryId && (
          <TouchableOpacity style={styles.seeAllBtn} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#37d1e4" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => <MovieItem item={item} onPress={onShowPress} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.showList}
      />
    </Animated.View>
  );
});

const FranchiseRow = memo(({ navigation }) => (
  <View style={styles.franchiseSection}>
    <Text style={styles.sectionTitle}>Browse by Network</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.franchiseList}>
      {FRANCHISE_ICONS.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.franchiseItem}
          onPress={() => navigation.navigate("Franchise", { franchise: item.name })}
          activeOpacity={0.8}
        >
          <View style={[styles.franchiseCircle, item.bgColor && { backgroundColor: item.bgColor }]}>
            {item.img ? (
              <Image
                source={item.img}
                style={[
                  styles.franchiseImage,
                  { transform: [{ scale: item.scale || 1 }] }
                ]}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.franchiseTextIcon}>{item.textIcon}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
));

// Continue Watching Row
const ContinueWatchingRow = memo(({ data, navigation, loading }) => {
  if (loading) return <SkeletonRow />;
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Continue Watching</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.continueCard}
            onPress={() => navigation.navigate("ShowDetails", { show: item })}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.backdrop || item.image }} style={styles.continueImage} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.continueGradient}>
              <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${item.progress || 30}%` }]} />
              </View>
            </LinearGradient>
            <View style={styles.continuePlayIcon}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => `continue-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.showList}
      />
    </View>
  );
});

// Trending Carousel Item with List functionality
const TrendingCarouselItem = memo(({ item, index, scrollX, CARD_WIDTH, CARD_HEIGHT, navigation }) => {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    checkListStatus();
  }, [item.id]);

  const checkListStatus = async () => {
    try {
      const status = await isInList(item.id, item.type);
      setInList(status);
    } catch (error) {
      console.error("Error checking list status:", error);
    }
  };

  const handleListToggle = async () => {
    try {
      if (inList) {
        await removeFromList(item.id, item.type);
        setInList(false);
      } else {
        await addToList({ ...item, media_type: item.type });
        setInList(true);
      }
    } catch (error) {
      console.error("Error toggling list:", error);
    }
  };

  const handlePress = () => {
    navigation.navigate("ShowDetails", {
      show: item,
      id: item.id,
      type: item.type,
      title: item.title,
    });
  };

  const handlePlay = () => {
    if (item.type === "movie") {
      navigation.navigate("VideoPlayer", {
        title: item.title,
        mediaId: item.id,
        mediaType: "movie",
      });
    } else {
      navigation.navigate("VideoPlayer", {
        title: item.title,
        mediaId: item.id,
        mediaType: "tv",
        season: 1,
        episode: 1,
      });
    }
  };

  const inputRange = [
    (index - 1) * CARD_WIDTH,
    index * CARD_WIDTH,
    (index + 1) * CARD_WIDTH,
  ];
  
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.1, 1, 1.1],
    extrapolate: 'clamp',
  });
  
  const contentOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  
  const contentTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [30, 0, 30],
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity 
      style={[styles.trendingCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      activeOpacity={0.95}
      onPress={handlePress}
    >
      <Animated.Image 
        source={{ uri: item.backdrop || item.image }} 
        style={[styles.trendingImage, { transform: [{ scale: imageScale }] }]} 
        resizeMode="cover" 
      />
      {/* Vignette effect */}
      <LinearGradient
        colors={['rgba(1,14,31,0.3)', 'transparent', 'transparent', 'rgba(1,14,31,0.4)']}
        locations={[0, 0.2, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(1,14,31,0.6)', '#010e1f']}
        locations={[0.3, 0.7, 1]}
        style={styles.trendingGradientOverlay}
        pointerEvents="none"
      />
      {/* Content */}
      <Animated.View style={[styles.trendingContent, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
        <View style={styles.trendingTitleArea}>
          <Text style={styles.trendingTitleText}>{item.title}</Text>
          <View style={styles.trendingMetaRow}>
            <View style={styles.trendingRatingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.trendingRatingValue}>{item.rating}</Text>
            </View>
            <Text style={styles.trendingMetaDivider}>|</Text>
            <Text style={styles.trendingYear}>{item.year}</Text>
            <Text style={styles.trendingMetaDivider}>|</Text>
            <Text style={styles.trendingType}>{item.type === 'tv' ? 'Series' : 'Film'}</Text>
          </View>
        </View>
        <Text style={styles.trendingDescription} numberOfLines={2}>{item.overview}</Text>
        <View style={styles.trendingButtonRow}>
          <TouchableOpacity style={styles.trendingPlayButton} onPress={handlePlay} activeOpacity={0.9}>
            <Ionicons name="play" size={22} color="#000" />
            <Text style={styles.trendingPlayText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.trendingAddButton, inList && styles.trendingAddButtonActive]} 
            onPress={handleListToggle}
            activeOpacity={0.8}
          >
            <Ionicons name={inList ? "checkmark" : "add"} size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.trendingInfoButton} onPress={handlePress} activeOpacity={0.8}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// Trending Carousel - Disney+ Hero Style
const TrendingCarousel = memo(({ data, navigation, loading, title = "Trending This Week" }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (loading) return <SkeletonRow />;
  if (!data || data.length === 0) return null;

  const CARD_WIDTH = width;
  const CARD_HEIGHT = height * 0.65; // Same height as homepage hero

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
        setActiveIndex(index);
      }
    }
  );

  const renderCarouselItem = ({ item, index }) => (
    <TrendingCarouselItem
      item={item}
      index={index}
      scrollX={scrollX}
      CARD_WIDTH={CARD_WIDTH}
      CARD_HEIGHT={CARD_HEIGHT}
      navigation={navigation}
    />
  );

  return (
    <View style={styles.trendingContainer}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => `trending-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
      {/* Pill indicators */}
      <View style={styles.trendingPillContainer}>
        {data.map((_, index) => (
          <TouchableOpacity 
            key={`pill-${index}`} 
            onPress={() => flatListRef.current?.scrollToIndex({ index, animated: true })}
            activeOpacity={0.7}
          >
            <View style={[
              styles.trendingPill,
              activeIndex === index && styles.trendingPillActive
            ]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// Top 10 Row with Netflix-style numbers overlaying cards
const Top10Row = memo(({ data, navigation, loading }) => {
  if (loading) return <SkeletonRow />;
  if (!data || data.length === 0) return null;

  // Render number with black outline effect
  const renderNumber = (num) => {
    const offsets = [
      { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 },
      { x: -2, y: -2 }, { x: 2, y: -2 }, { x: -2, y: 2 }, { x: 2, y: 2 },
      { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
    ];
    
    return (
      <View style={styles.top10NumberWrapper}>
        {/* Black outline layers */}
        {offsets.map((offset, i) => (
          <Text
            key={i}
            style={[
              styles.top10NumberOutline,
              { left: offset.x, top: offset.y }
            ]}
          >
            {num}
          </Text>
        ))}
        {/* White fill on top */}
        <Text style={styles.top10Number}>{num}</Text>
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.top10Header}>
        <Text style={styles.top10Title}>Top 10 This Week</Text>
        <View style={styles.top10Badge}>
          <Text style={styles.top10BadgeText}>TOP 10</Text>
        </View>
      </View>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.top10Card}
            onPress={() => navigation.navigate("ShowDetails", { show: item })}
            activeOpacity={0.8}
          >
            <View style={styles.top10NumberContainer}>
              {renderNumber(index + 1)}
            </View>
            <Image source={{ uri: item.image }} style={styles.top10Image} resizeMode="cover" />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => `top10-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top10List}
      />
    </View>
  );
});

// Split Hero Section - Premium Featured Section (Full-width spotlight cards with transparent blending)
const SplitHeroSection = memo(({ items, navigation }) => {
  if (!items || items.length < 2) return null;

  return (
    <View style={styles.featuredContainer}>
      <View style={styles.featuredHeader}>
        <Text style={styles.featuredSectionTitle}>Featured</Text>
        <Text style={styles.featuredSubtitle}>Handpicked for you</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.featuredScroll}
        decelerationRate="fast"
        snapToInterval={width * 0.85 + 12}
        snapToAlignment="start"
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.featuredCard}
            onPress={() => navigation.navigate("ShowDetails", { show: item })}
            activeOpacity={0.95}
          >
            <Image source={{ uri: item.backdrop || item.image }} style={styles.featuredImage} resizeMode="cover" />
            {/* Left edge fade */}
            <LinearGradient
              colors={["rgba(1,14,31,0.6)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.15, y: 0.5 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
              pointerEvents="none"
            />
            {/* Right edge fade */}
            <LinearGradient
              colors={["transparent", "rgba(1,14,31,0.6)"]}
              start={{ x: 0.85, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
              pointerEvents="none"
            />
            {/* Bottom content gradient */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)", "rgba(1,14,31,0.98)"]}
              locations={[0, 0.4, 1]}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredTopRow}>
                  {index === 0 && (
                    <View style={styles.featuredSpotlight}>
                      <Ionicons name="trophy" size={12} color="#FFD700" />
                      <Text style={styles.featuredSpotlightText}>#1 SPOTLIGHT</Text>
                    </View>
                  )}
                  {index === 1 && (
                    <View style={styles.featuredEditorPick}>
                      <Ionicons name="star" size={12} color="#37d1e4" />
                      <Text style={styles.featuredEditorText}>EDITOR'S PICK</Text>
                    </View>
                  )}
                  <View style={styles.featuredTypePill}>
                    <Text style={styles.featuredTypeText}>{item.type === 'tv' ? 'SERIES' : 'FILM'}</Text>
                  </View>
                </View>

                <Text style={styles.featuredTitle}>{item.title}</Text>

                <View style={styles.featuredMetaRow}>
                  <View style={styles.featuredRatingBox}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.featuredRatingText}>{item.rating}</Text>
                  </View>
                  <Text style={styles.featuredYear}>{item.year}</Text>
                  <View style={styles.featuredDot} />
                  <Text style={styles.featuredGenre}>Trending</Text>
                </View>

                <Text style={styles.featuredOverview} numberOfLines={2}>{item.overview}</Text>

                <View style={styles.featuredActions}>
                  <TouchableOpacity
                    style={styles.featuredPlayBtn}
                    onPress={() => navigation.navigate("ShowDetails", { show: item })}
                  >
                    <Ionicons name="play" size={20} color="#000" />
                    <Text style={styles.featuredPlayText}>Play</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.featuredMoreBtn}>
                    <Ionicons name="information-circle-outline" size={22} color="#fff" />
                    <Text style={styles.featuredMoreText}>More Info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.featuredAddBtn}>
                    <Ionicons name="add" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

// Stories Section - Episode Updates (Instagram-style circles)
const StoriesSection = memo(({ data, navigation, onStoryPress }) => {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.storiesContainer}>
      <Text style={styles.sectionTitle}>New Episodes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesList}>
        {data.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.storyItem}
            onPress={() => onStoryPress(item, index)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#37d1e4", "#1a8a9e", "#0d5c6b"]}
              style={styles.storyRing}
            >
              <View style={styles.storyImageContainer}>
                <Image source={{ uri: item.image }} style={styles.storyImage} resizeMode="cover" />
              </View>
            </LinearGradient>
            <Text style={styles.storyTitle} numberOfLines={1}>{item.title}</Text>
            {item.airDateText && (
              <View style={styles.storyDateBadge}>
                <Text style={styles.storyDateText}>{item.airDateText}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

// Random Pick Section - "Surprise Me" feature
const RandomPickSection = memo(({ navigation, onSurpriseMe, isLoading }) => {
  return (
    <View style={styles.randomPickContainer}>
      <LinearGradient
        colors={["rgba(55,209,228,0.15)", "rgba(55,209,228,0.05)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.randomPickGradient}
      >
        <View style={styles.randomPickContent}>
          <View style={styles.randomPickTextContainer}>
            <View style={styles.randomPickIconRow}>
              <Ionicons name="shuffle" size={24} color="#37d1e4" />
              <Text style={styles.randomPickTitle}>Can't Decide?</Text>
            </View>
            <Text style={styles.randomPickSubtitle}>Let us pick something amazing for you</Text>
          </View>
          <TouchableOpacity
            style={[styles.surpriseMeButton, isLoading && styles.surpriseMeButtonDisabled]}
            onPress={onSurpriseMe}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Animated.View style={styles.surpriseMeLoading}>
                <Ionicons name="sync" size={20} color="#000" />
              </Animated.View>
            ) : (
              <>
                <Ionicons name="dice" size={20} color="#000" />
                <Text style={styles.surpriseMeText}>Surprise Me</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
});

// Story Viewer Modal - Episode Updates with static images
const StoryViewer = memo(({ visible, stories, initialIndex, onClose, navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [inList, setInList] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsDescExpanded(false);
  }, [initialIndex]);

  useEffect(() => {
    if (currentStory?.id) {
      checkListStatus();
    }
  }, [currentStory?.id]);

  const checkListStatus = async () => {
    if (!currentStory) return;
    try {
      const status = await isInList(currentStory.id, currentStory.type || "tv");
      setInList(status);
    } catch (error) {
      console.error("Error checking list status:", error);
    }
  };

  const handleListToggle = async () => {
    if (!currentStory) return;
    const mediaType = currentStory.type || "tv";
    try {
      if (inList) {
        await removeFromList(currentStory.id, mediaType);
        setInList(false);
      } else {
        await addToList({ ...currentStory, media_type: mediaType });
        setInList(true);
      }
    } catch (error) {
      console.error("Error toggling list:", error);
    }
  };

  useEffect(() => {
    if (visible && currentStory) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) goToNext();
      });
    }
    return () => progressAnim.stopAnimation();
  }, [currentIndex, visible]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsDescExpanded(false);
    } else {
      onClose();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsDescExpanded(false);
    }
  };

  if (!visible || !currentStory) return null;

  const description = currentStory.overview || "No description available.";
  const shouldShowSeeMore = description.length > 120;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.storyViewerContainer}>
        <StatusBar hidden />

        {/* Progress bars */}
        <View style={styles.storyProgressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.storyProgressBg}>
              <Animated.View
                style={[
                  styles.storyProgressFill,
                  {
                    width: index < currentIndex ? "100%" : index === currentIndex
                      ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                      : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.storyHeader}>
          <View style={styles.storyHeaderLeft}>
            <Image source={{ uri: currentStory.image }} style={styles.storyHeaderImage} />
            <View>
              <Text style={styles.storyHeaderTitle} numberOfLines={1}>{currentStory.title}</Text>
              <Text style={styles.storyHeaderSub}>
                {currentStory.episodeInfo && `${currentStory.episodeInfo} • `}{currentStory.airDateText}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.storyHeaderBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Static Image Content */}
        <View style={styles.storyContent}>
          <Image source={{ uri: currentStory.backdrop }} style={styles.storyBackdrop} resizeMode="cover" />
        </View>

        {/* Touch areas for navigation */}
        <View style={styles.storyTouchAreas}>
          <TouchableOpacity style={styles.storyTouchLeft} onPress={goToPrev} />
          <TouchableOpacity style={styles.storyTouchRight} onPress={goToNext} />
        </View>

        {/* Bottom info */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.storyBottomGradient}>
          {currentStory.airDateText && (
            <View style={styles.storyEpisodeBadge}>
              <Ionicons name="calendar" size={14} color="#37d1e4" />
              <Text style={styles.storyEpisodeBadgeText}>{currentStory.airDateText}</Text>
              {currentStory.episodeInfo && (
                <Text style={styles.storyEpisodeNumber}>{currentStory.episodeInfo}</Text>
              )}
            </View>
          )}
          <Text style={styles.storyBottomTitle}>{currentStory.title}</Text>
          {currentStory.episodeName && (
            <Text style={styles.storyEpisodeName}>"{currentStory.episodeName}"</Text>
          )}
          
          {/* Description with See More */}
          <View style={styles.storyDescriptionContainer}>
            <Text 
              style={styles.storyBottomOverview} 
              numberOfLines={isDescExpanded ? undefined : 3}
            >
              {description}
            </Text>
            {!isDescExpanded && shouldShowSeeMore && (
              <TouchableOpacity onPress={() => setIsDescExpanded(true)} style={styles.storySeeMoreBtn}>
                <Text style={styles.storySeeMoreText}>See More</Text>
              </TouchableOpacity>
            )}
            {isDescExpanded && (
              <TouchableOpacity onPress={() => setIsDescExpanded(false)} style={styles.storySeeMoreBtn}>
                <Text style={styles.storySeeMoreText}>See Less</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.storyBottomButtons}>
            <TouchableOpacity
              style={styles.storyWatchBtn}
              onPress={() => {
                onClose();
                navigation.navigate("ShowDetails", { show: currentStory });
              }}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.storyWatchBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.storyInfoBtn} onPress={handleListToggle}>
              <Ionicons name={inList ? "checkmark" : "add"} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
});


const FeaturedHero = memo(({ item, navigation }) => {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    if (item?.id && item?.type) {
      checkListStatus();
    }
  }, [item?.id]);

  const checkListStatus = async () => {
    try {
      const status = await isInList(item.id, item.type || "movie");
      setInList(status);
    } catch (error) {
      console.error("Error checking list status:", error);
    }
  };

  const handleListToggle = async () => {
    if (!item) return;
    const mediaType = item.type || "movie";
    try {
      if (inList) {
        await removeFromList(item.id, mediaType);
        setInList(false);
      } else {
        await addToList({ ...item, media_type: mediaType });
        setInList(true);
      }
    } catch (error) {
      console.error("Error toggling list:", error);
    }
  };

  const handlePlay = () => {
    if (!item) return;
    if (item.type === "movie") {
      navigation.navigate("VideoPlayer", {
        title: item.title,
        mediaId: item.id,
        mediaType: "movie",
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
      });
    } else {
      // For TV shows, play first episode
      navigation.navigate("VideoPlayer", {
        title: item.title,
        mediaId: item.id,
        mediaType: "tv",
        season: 1,
        episode: 1,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
      });
    }
  };

  if (!item) return null;

  return (
    <TouchableOpacity 
      style={styles.heroContainer} 
      activeOpacity={0.95}
      onPress={() => navigation.navigate("ShowDetails", { show: item })}
    >
      <Image source={{ uri: item.backdrop || item.image }} style={styles.heroImage} resizeMode="cover" />
      <LinearGradient colors={["transparent", "rgba(1,14,31,0.8)", "#010e1f"]} locations={[0.4, 0.75, 1]} style={styles.heroGradient}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item.title}</Text>
          <Text style={styles.heroGenres}>{item.type === 'tv' ? 'Series' : 'Film'} • {item.rating} ★ • {item.year}</Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.myListButton} onPress={handleListToggle}>
              <Ionicons name={inList ? "checkmark" : "add"} size={24} color="#fff" />
              <Text style={styles.myListText}>{inList ? "Added" : "My List"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate("ShowDetails", { show: item })}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
              <Text style={styles.infoText}>Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const TabContent = memo(({ tabId, sections, featuredItem, navigation, myListData, myListLoading, continueWatchingData, continueWatchingLoading, top10Data, top10Loading, splitHeroData, storiesData, onStoryPress, onSurpriseMe, surpriseMeLoading, trendingTVData, trendingTVLoading, trendingMoviesData, trendingMoviesLoading }) => {
  if (tabId === "My List") {
    return (
      <ScrollView style={styles.myListContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderTitle}>My List</Text>
        </View>
        {myListLoading ? (
          <SkeletonRow />
        ) : myListData && myListData.length > 0 ? (
          <View style={styles.section}>
            <FlatList
              data={myListData}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.myListCard}
                  onPress={() => navigation.navigate("ShowDetails", { show: item })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    style={styles.myListImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => `${item.media_id}-${item.media_type}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.showList}
            />
          </View>
        ) : (
          <View style={styles.emptyList}>
            <Ionicons name="bookmark-outline" size={64} color="#555" />
            <Text style={styles.emptyListText}>Your list is empty</Text>
            <Text style={styles.emptyListSubtext}>Add movies and shows to your list to watch later</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  if (tabId === "Live TV") {
    return <LiveTVScreen />;
  }

  return (
    <FlatList
      data={sections}
      renderItem={({ item }) => (
        <HorizontalList
          title={item.title}
          data={item.data}
          loading={item.loading}
          onShowPress={(show) => navigation.navigate("ShowDetails", { show })}
          navigation={navigation}
          categoryId={item.id}
          categoryType={tabId === "Movies" ? "movie" : tabId === "TV Shows" ? "tv" : "mixed"}
        />
      )}
      keyExtractor={(item, index) => `${tabId}-${item.id}-${index}`}
      ListHeaderComponent={() => (
        <View>
          {tabId === "Home" && (
            <>
              <FeaturedHero item={featuredItem} navigation={navigation} />
              <ContinueWatchingRow data={continueWatchingData} navigation={navigation} loading={continueWatchingLoading} />
              <Top10Row data={top10Data} navigation={navigation} loading={top10Loading} />
              <StoriesSection data={storiesData} navigation={navigation} onStoryPress={onStoryPress} />
              <SplitHeroSection items={splitHeroData} navigation={navigation} />
              <RandomPickSection navigation={navigation} onSurpriseMe={onSurpriseMe} isLoading={surpriseMeLoading} />
            </>
          )}
          {tabId === "TV Shows" && (
            <TrendingCarousel 
              data={trendingTVData} 
              navigation={navigation} 
              loading={trendingTVLoading}
              title="Trending TV Shows This Week"
            />
          )}
          {tabId === "Movies" && (
            <TrendingCarousel 
              data={trendingMoviesData} 
              navigation={navigation} 
              loading={trendingMoviesLoading}
              title="Trending Movies This Week"
            />
          )}
          {tabId !== "Home" && tabId !== "TV Shows" && tabId !== "Movies" && (
            <View style={styles.tabHeader}>
              <Text style={styles.tabHeaderTitle}>{tabId}</Text>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
});

const BottomNavBar = memo(({ activeIndex, onTabChange, indicatorAnim }) => {
  const tabWidth = width / TABS.length;

  return (
    <View style={styles.bottomNav}>
      <Animated.View
        style={[
          styles.navIndicator,
          {
            width: tabWidth - 16,
            transform: [{
              translateX: indicatorAnim.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [8, tabWidth + 8, tabWidth * 2 + 8, tabWidth * 3 + 8],
              }),
            }],
          },
        ]}
      />

      {TABS.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => onTabChange(index)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? "#fff" : "#888"}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});


const HomeScreen = ({ navigation }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabData, setTabData] = useState({});
  const [featuredItem, setFeaturedItem] = useState(null);
  const [myListData, setMyListData] = useState([]);
  const [myListLoading, setMyListLoading] = useState(false);

  // New state for additional sections
  const [continueWatchingData, setContinueWatchingData] = useState([]);
  const [continueWatchingLoading, setContinueWatchingLoading] = useState(true);
  const [top10Data, setTop10Data] = useState([]);
  const [top10Loading, setTop10Loading] = useState(true);
  const [splitHeroData, setSplitHeroData] = useState([]);
  const [storiesData, setStoriesData] = useState([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [storyInitialIndex, setStoryInitialIndex] = useState(0);
  const [surpriseMeLoading, setSurpriseMeLoading] = useState(false);
  
  // Trending carousel data
  const [trendingTVData, setTrendingTVData] = useState([]);
  const [trendingTVLoading, setTrendingTVLoading] = useState(true);
  const [trendingMoviesData, setTrendingMoviesData] = useState([]);
  const [trendingMoviesLoading, setTrendingMoviesLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const currentTab = CONTENT_TABS[activeTabIndex]?.id || "Home";

  useEffect(() => {
    loadFeaturedItem();
    loadContinueWatching();
    loadTop10AndSplitHero();
    loadTrendingCarousels();
    loadStories();
  }, []);

  useEffect(() => {
    loadTabData(currentTab);
  }, [currentTab]);

  const loadFeaturedItem = async () => {
    try {
      const data = await fetchTrending("week");
      if (data && data.length > 0) {
        setFeaturedItem(data[0]);
      }
    } catch (e) {
      console.error("Error loading featured:", e);
    }
  };

  const loadContinueWatching = async () => {
    setContinueWatchingLoading(true);
    try {
      const data = await getContinueWatching();
      const transformedData = data.map(item => ({
        ...item,
        id: item.media_id,
        type: item.media_type,
        title: item.title,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
        progress: item.progress_percent || 30,
      }));
      setContinueWatchingData(transformedData);
    } catch (e) {
      console.error("Error loading continue watching:", e);
    } finally {
      setContinueWatchingLoading(false);
    }
  };

  // Load Top 10 first, then load Split Hero excluding Top 10 IDs
  const loadTop10AndSplitHero = async () => {
    setTop10Loading(true);
    try {
      const top10 = await fetchTop10ThisWeek();
      setTop10Data(top10);
      setTop10Loading(false);
      
      // Now load split hero, excluding Top 10 IDs
      const top10Ids = top10.map(item => item.id);
      const splitHero = await fetchSplitHeroTitles(top10Ids);
      setSplitHeroData(splitHero);
    } catch (e) {
      console.error("Error loading top 10 or split hero:", e);
      setTop10Loading(false);
    }
  };

  const loadTrendingCarousels = async () => {
    setTrendingTVLoading(true);
    setTrendingMoviesLoading(true);
    try {
      const [tvData, moviesData] = await Promise.all([
        fetchTrendingTVShows("week", 6),
        fetchTrendingMovies("week", 6),
      ]);
      setTrendingTVData(tvData);
      setTrendingMoviesData(moviesData);
    } catch (e) {
      console.error("Error loading trending carousels:", e);
    } finally {
      setTrendingTVLoading(false);
      setTrendingMoviesLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const data = await fetchUpcomingEpisodes();
      setStoriesData(data);
    } catch (e) {
      console.error("Error loading stories:", e);
    }
  };

  const handleStoryPress = useCallback((item, index) => {
    setStoryInitialIndex(index);
    setStoryViewerVisible(true);
  }, []);

  const handleSurpriseMe = useCallback(async () => {
    setSurpriseMeLoading(true);
    try {
      const randomShow = await fetchRandomPick();
      if (randomShow) {
        navigation.navigate("ShowDetails", { show: randomShow });
      }
    } catch (e) {
      console.error("Error fetching random pick:", e);
    } finally {
      setSurpriseMeLoading(false);
    }
  }, [navigation]);

  const loadMyList = async () => {
    setMyListLoading(true);
    try {
      const data = await getUserList();
      const transformedData = data.map(item => ({
        ...item,
        id: item.media_id,
        type: item.media_type,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
      }));
      setMyListData(transformedData);
    } catch (e) {
      console.error("Error loading my list:", e);
    } finally {
      setMyListLoading(false);
    }
  };

  const loadTabData = async (tabId) => {
    if (tabId === "My List") {
      loadMyList();
      return;
    }

    if (tabData[tabId]?.loaded) return;

    const config = SECTIONS_CONFIG[tabId] || [];
    if (config.length === 0) return;

    setTabData(prev => ({
      ...prev,
      [tabId]: {
        sections: config.map(item => ({ ...item, data: [], loading: true })),
        loaded: false,
      },
    }));

    const promises = config.map(async (section, index) => {
      try {
        const data = await section.fn(...(section.params || []));
        setTabData(prev => {
          const tabState = prev[tabId];
          if (!tabState) return prev;
          const newSections = [...tabState.sections];
          if (newSections[index]) {
            newSections[index] = { ...newSections[index], data, loading: false };
          }
          return { ...prev, [tabId]: { ...tabState, sections: newSections, loaded: true } };
        });
      } catch (error) {
        console.error(`Error loading ${section.title}:`, error);
      }
    });

    await Promise.all(promises);
  };

  const animateToTab = (newIndex) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -newIndex * width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(indicatorAnim, {
        toValue: newIndex,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTabIndex(newIndex);
  };

  const handleTabChange = (index) => {
    if (index >= 0 && index < CONTENT_TABS.length) {
      animateToTab(index);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.navigate("Search")} style={styles.headerIcon}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfile")} style={styles.headerIcon}>
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.contentArea}>
        <Animated.View
          style={[
            styles.tabsContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {CONTENT_TABS.map((tab) => (
            <View key={tab.id} style={styles.tabPane}>
              <TabContent
                tabId={tab.id}
                sections={tabData[tab.id]?.sections || []}
                featuredItem={featuredItem}
                navigation={navigation}
                myListData={myListData}
                myListLoading={myListLoading}
                continueWatchingData={continueWatchingData}
                continueWatchingLoading={continueWatchingLoading}
                top10Data={top10Data}
                top10Loading={top10Loading}
                splitHeroData={splitHeroData}
                storiesData={storiesData}
                onStoryPress={handleStoryPress}
                onSurpriseMe={handleSurpriseMe}
                surpriseMeLoading={surpriseMeLoading}
                trendingTVData={trendingTVData}
                trendingTVLoading={trendingTVLoading}
                trendingMoviesData={trendingMoviesData}
                trendingMoviesLoading={trendingMoviesLoading}
              />
            </View>
          ))}
        </Animated.View>
      </View>

      <StoryViewer
        visible={storyViewerVisible}
        stories={storiesData}
        initialIndex={storyInitialIndex}
        onClose={() => setStoryViewerVisible(false)}
        navigation={navigation}
      />

      <BottomNavBar
        activeIndex={activeTabIndex}
        onTabChange={handleTabChange}
        indicatorAnim={indicatorAnim}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#010e1f" },
  headerSafeArea: { backgroundColor: "transparent", position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  headerIcon: { padding: 8 },
  contentArea: { flex: 1, overflow: "hidden" },
  tabsContainer: { flexDirection: "row", width: width * CONTENT_TABS.length, flex: 1 },
  tabPane: { width, flex: 1 },
  listContent: { paddingBottom: 20 },
  heroContainer: { width, height: height * 0.65 },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", paddingBottom: 20 },
  heroContent: { alignItems: "center", paddingHorizontal: 20 },
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  heroGenres: { color: "#ccc", fontSize: 11, textAlign: "center", marginBottom: 16 },
  heroButtons: { flexDirection: "row", alignItems: "center", gap: 24 },
  myListButton: { alignItems: "center" },
  myListText: { color: "#fff", fontSize: 10, marginTop: 4 },
  playButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 4, gap: 6 },
  playButtonText: { color: "#000", fontSize: 14, fontWeight: "700" },
  infoButton: { alignItems: "center" },
  infoText: { color: "#fff", fontSize: 10, marginTop: 4 },
  franchiseSection: { marginBottom: 24 },
  franchiseList: { paddingHorizontal: 16, gap: 12 },
  franchiseItem: { alignItems: "center" },
  franchiseCircle: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", borderWidth: 2, borderColor: "#1a3a5c" },
  franchiseImage: { width: "100%", height: "100%" },
  franchiseTextIcon: { color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 16, marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 16 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { color: "#37d1e4", fontSize: 13, fontWeight: "600" },
  showList: { paddingHorizontal: 16, gap: 8 },
  showCard: { width: 110, height: 160, borderRadius: 4, overflow: "hidden", backgroundColor: "#0a1929" },
  showImage: { width: "100%", height: "100%" },
  tabHeader: { paddingHorizontal: 16, paddingTop: 100, paddingBottom: 16 },
  tabHeaderSpacer: { paddingTop: 80 },
  tabHeaderTitle: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#010e1f",
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderTopColor: "#1a3a5c",
    position: "relative",
  },
  navIndicator: { position: "absolute", top: 0, left: 0, height: 3, backgroundColor: "#37d1e4", borderRadius: 2 },
  navItem: { alignItems: "center", flex: 1, zIndex: 1 },
  navLabel: { color: "#888", fontSize: 10, marginTop: 4 },
  navLabelActive: { color: "#fff" },
  myListContainer: { flex: 1, paddingTop: 80 },
  myListCard: { width: 110, height: 160, borderRadius: 4, overflow: "hidden", backgroundColor: "#0a1929" },
  myListImage: { width: "100%", height: "100%" },
  emptyList: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyListText: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptyListSubtext: { color: "#888", fontSize: 14, textAlign: "center", marginTop: 8 },

  // Continue Watching styles
  continueCard: { width: 180, height: 100, borderRadius: 6, overflow: "hidden", backgroundColor: "#0a1929", marginRight: 8 },
  continueImage: { width: "100%", height: "100%" },
  continueGradient: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: 8 },
  continueTitle: { color: "#fff", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  progressBarContainer: { height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
  progressBar: { height: "100%", backgroundColor: "#37d1e4", borderRadius: 2 },
  continuePlayIcon: { position: "absolute", top: "50%", left: "50%", marginTop: -16, marginLeft: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },

  // Trending Carousel styles - Disney+ Hero Style (full-bleed like homepage)
  trendingContainer: { },
  trendingCard: { overflow: "hidden" },
  trendingImage: { width: "100%", height: "100%" },
  trendingGradientOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: "70%" },
  trendingContent: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 24 },
  trendingTitleArea: { marginBottom: 12 },
  trendingTitleText: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  trendingMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 10 },
  trendingRatingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendingRatingValue: { color: "#FFD700", fontSize: 14, fontWeight: "700" },
  trendingMetaDivider: { color: "rgba(255,255,255,0.3)", fontSize: 14 },
  trendingYear: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },
  trendingType: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },
  trendingDescription: { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20, marginBottom: 20 },
  trendingButtonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  trendingPlayButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, gap: 8 },
  trendingPlayText: { color: "#000", fontSize: 17, fontWeight: "700" },
  trendingAddButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  trendingAddButtonActive: { backgroundColor: "rgba(55,209,228,0.3)", borderColor: "#37d1e4" },
  trendingInfoButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  trendingPillContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8 },
  trendingPill: { width: 24, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  trendingPillActive: { width: 32, backgroundColor: "#fff" },

  // Top 10 styles - Netflix style with outlined numbers
  top10Header: { flexDirection: "row", alignItems: "center", marginLeft: 16, marginBottom: 12 },
  top10Title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  top10Badge: { backgroundColor: "#e50914", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, marginLeft: 8 },
  top10BadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  top10List: { paddingHorizontal: 16 },
  top10Card: { flexDirection: "row", alignItems: "flex-end", marginRight: 8 },
  top10NumberContainer: { justifyContent: "flex-end", alignItems: "center", marginRight: -18, zIndex: 1, minWidth: 40 },
  top10NumberWrapper: { position: "relative", justifyContent: "center", alignItems: "center" },
  top10NumberOutline: {
    position: "absolute",
    fontSize: 72,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#000",
    includeFontPadding: false,
  },
  top10Number: {
    fontSize: 72,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#fff",
    includeFontPadding: false,
  },
  top10Image: { width: 110, height: 160, borderRadius: 6, backgroundColor: "#0a1929" },

  // Featured Section styles - Premium spotlight cards with transparent blending sides
  featuredContainer: { marginBottom: 24 },
  featuredHeader: { paddingHorizontal: 16, marginBottom: 12 },
  featuredTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featuredSectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  featuredSubtitle: { color: "#888", fontSize: 12, marginTop: 2 },
  featuredScroll: { paddingLeft: 16, paddingRight: 8 },
  featuredCard: { width: width * 0.85, height: 240, borderRadius: 12, overflow: "visible", backgroundColor: "transparent", marginRight: 12 },
  featuredImage: { width: "100%", height: "100%", borderRadius: 12 },
  featuredGradient: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: 16, borderRadius: 12 },
  featuredContent: { gap: 6 },
  featuredTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featuredSpotlight: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, borderWidth: 1, borderColor: "rgba(255,215,0,0.4)" },
  featuredSpotlightText: { color: "#FFD700", fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  featuredEditorPick: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(55,209,228,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4, borderWidth: 1, borderColor: "rgba(55,209,228,0.4)" },
  featuredEditorText: { color: "#37d1e4", fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  featuredTypePill: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 0 },
  featuredTypeText: { color: "#fff", fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  featuredTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  featuredMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featuredRatingBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  featuredRatingText: { color: "#FFD700", fontSize: 14, fontWeight: "700" },
  featuredYear: { color: "#aaa", fontSize: 13 },
  featuredDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#555" },
  featuredGenre: { color: "#37d1e4", fontSize: 13, fontWeight: "500" },
  featuredOverview: { color: "#bbb", fontSize: 12, lineHeight: 17 },
  featuredActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  featuredPlayBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 4, gap: 6 },
  featuredPlayText: { color: "#000", fontSize: 14, fontWeight: "700" },
  featuredMoreBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, gap: 4, borderWidth: 0 },
  featuredMoreText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  featuredAddBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 0 },

  // Random Pick Section styles
  randomPickContainer: { marginHorizontal: 16, marginBottom: 24, borderRadius: 16, overflow: "hidden" },
  randomPickGradient: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(55,209,228,0.2)" },
  randomPickContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  randomPickTextContainer: { flex: 1, marginRight: 16 },
  randomPickIconRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  randomPickTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  randomPickSubtitle: { color: "#888", fontSize: 13 },
  surpriseMeButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#37d1e4", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, gap: 8 },
  surpriseMeButtonDisabled: { opacity: 0.7 },
  surpriseMeText: { color: "#000", fontSize: 14, fontWeight: "bold" },
  surpriseMeLoading: { width: 20, height: 20 },

  // Stories styles - Episode Updates
  storiesContainer: { marginBottom: 24 },
  storiesList: { paddingHorizontal: 16, gap: 12 },
  storyItem: { alignItems: "center", width: 76 },
  storyRing: { width: 68, height: 68, borderRadius: 34, padding: 3, justifyContent: "center", alignItems: "center" },
  storyImageContainer: { width: 60, height: 60, borderRadius: 30, overflow: "hidden", borderWidth: 2, borderColor: "#010e1f" },
  storyImage: { width: "100%", height: "100%" },
  storyTitle: { color: "#fff", fontSize: 10, marginTop: 4, textAlign: "center" },
  storyDateBadge: { backgroundColor: "#e50914", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  storyDateText: { color: "#fff", fontSize: 8, fontWeight: "bold" },

  // Story Viewer styles
  storyViewerContainer: { flex: 1, backgroundColor: "#000" },
  storyProgressContainer: { flexDirection: "row", paddingHorizontal: 8, paddingTop: 50, gap: 4, zIndex: 10 },
  storyProgressBg: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 1 },
  storyProgressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 1 },
  storyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, zIndex: 10 },
  storyHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  storyHeaderImage: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 2, borderColor: "#37d1e4" },
  storyHeaderTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  storyHeaderSub: { color: "#37d1e4", fontSize: 11, marginTop: 1, fontWeight: "500" },
  storyHeaderBtn: { padding: 4 },
  storyContent: { flex: 1, backgroundColor: "#000" },
  storyBackdrop: { width: "100%", height: "100%" },
  storyTouchAreas: { ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 5 },
  storyTouchLeft: { flex: 1 },
  storyTouchRight: { flex: 1 },
  storyBottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 50, paddingTop: 80, zIndex: 10 },
  storyEpisodeBadge: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  storyEpisodeBadgeText: { color: "#37d1e4", fontSize: 14, fontWeight: "bold" },
  storyEpisodeNumber: { color: "#fff", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  storyBottomTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  storyEpisodeName: { color: "#aaa", fontSize: 14, fontStyle: "italic", marginBottom: 8 },
  storyDescriptionContainer: { marginBottom: 16 },
  storyBottomOverview: { color: "#ccc", fontSize: 13, lineHeight: 18 },
  storySeeMoreBtn: { marginTop: 4 },
  storySeeMoreText: { color: "#37d1e4", fontSize: 13, fontWeight: "600" },
  storyBottomButtons: { flexDirection: "row", alignItems: "center", gap: 12 },
  storyWatchBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 4, gap: 8 },
  storyWatchBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
  storyInfoBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  // Live TV styles
  liveTVContainer: { flex: 1, paddingTop: 80 },
  liveTVContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  liveTVTitle: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 16 },
  liveTVSubtitle: { color: "#888", fontSize: 16, marginTop: 8 },
});

export default HomeScreen;
