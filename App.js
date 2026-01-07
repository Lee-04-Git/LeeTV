import React from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { MyListProvider } from "./src/context/MyListContext";

export default function App() {
  return (
    <MyListProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </MyListProvider>
  );
}
