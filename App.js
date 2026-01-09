import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
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

  if (!appIsReady) {
    return <CustomSplash />;
  }

  return (
    <MyListProvider>
      <StatusBar style="light" />
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
