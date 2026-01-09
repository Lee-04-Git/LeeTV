export default {
  expo: {
    name: "LeeTV",
    slug: "LeeTV",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/LeeTV-logo.jpeg",
      resizeMode: "contain",
      backgroundColor: "#010e1f",
    },
    ios: {
      bundleIdentifier: "com.leetv.app",
      supportsTablet: true,
    },
    android: {
      package: "com.leetv.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "react-native-video"
    ],
  },
};
