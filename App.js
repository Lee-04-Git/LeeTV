import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { MyListProvider } from "./src/context/MyListContext";

function CustomSplash() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require("./assets/LeeTV-logo.jpeg")}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Set navigation bar to be visible but with transparent background
    const setupNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync("visible");
        await NavigationBar.setBackgroundColorAsync("#010e1f");
        await NavigationBar.setButtonStyleAsync("light");
      } catch (error) {
        console.log("Navigation bar setup not supported");
      }
    };

    setupNavigationBar();
  }, []);

  if (!appIsReady) {
    return <CustomSplash />;
  }

  return (
    <MyListProvider>
      <StatusBar style="light" hidden={false} />
      <AppNavigator />
    </MyListProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#010e1f",
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: 200,
    height: 200,
  },
});
