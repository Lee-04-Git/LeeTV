/**
 * Temporary Clear Data Button Component
 * Add this to your HomeScreen or App.js to clear continue watching data
 * Remove after clearing!
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { clearVidrockProgress } from "./src/services/vidrockService";

const ClearDataButton = () => {
  const handleClear = async () => {
    Alert.alert(
      "Clear Continue Watching",
      "Are you sure you want to clear all continue watching data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearVidrockProgress();
              Alert.alert("Success", "All continue watching data cleared!");
              console.log("✅ Continue watching cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
              console.error("❌ Error clearing:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleClear}>
      <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ff3b30",
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ClearDataButton;

/**
 * HOW TO USE:
 * 
 * 1. Import in your HomeScreen.js or App.js:
 *    import ClearDataButton from './ClearDataButton';
 * 
 * 2. Add to your render:
 *    <ClearDataButton />
 * 
 * 3. Run the app and tap the button
 * 
 * 4. Remove this component and import after clearing!
 */
