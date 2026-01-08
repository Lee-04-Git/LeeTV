import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../constants/colors";

const { width } = Dimensions.get("window");

// Netflix-style shimmer card with sweep animation
const ShimmerCard = ({ style }) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardInner}>
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255, 255, 255, 0.08)",
              "rgba(255, 255, 255, 0.15)",
              "rgba(255, 255, 255, 0.08)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// Title placeholder with shimmer
const ShimmerTitle = () => {
  const translateX = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 150,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={styles.titlePlaceholder}>
      <Animated.View
        style={[styles.shimmerSmall, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.1)",
            "rgba(255, 255, 255, 0.2)",
            "rgba(255, 255, 255, 0.1)",
            "transparent",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonFeatured = () => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={styles.featuredContainer}>
      <View style={styles.featuredInner}>
        <Animated.View
          style={[styles.shimmerLarge, { transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255, 255, 255, 0.05)",
              "rgba(255, 255, 255, 0.1)",
              "rgba(255, 255, 255, 0.05)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export const SkeletonRow = () => {
  return (
    <View style={styles.section}>
      <ShimmerTitle />
      <View style={styles.row}>
        {[1, 2, 3, 4].map((i) => (
          <ShimmerCard key={i} />
        ))}
      </View>
    </View>
  );
};

export const SkeletonGrid = () => {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ShimmerCard key={i} style={styles.gridCard} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 110,
    height: 150,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  shimmer: {
    width: width,
    height: "100%",
  },
  shimmerSmall: {
    width: 150,
    height: "100%",
  },
  shimmerLarge: {
    width: width * 2,
    height: "100%",
  },
  titlePlaceholder: {
    width: 150,
    height: 24,
    marginLeft: 20,
    marginBottom: 12,
    borderRadius: 4,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  featuredContainer: {
    width: width,
    height: width * 1.1,
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  featuredInner: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-between",
  },
  gridCard: {
    width: (width - 40) / 3,
    height: 160,
    marginBottom: 10,
  },
});
