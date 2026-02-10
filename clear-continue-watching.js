/**
 * Clear Continue Watching Data
 * Run this script to completely clear all continue watching data
 * 
 * Usage:
 * 1. Add this to your app temporarily
 * 2. Call clearAllData() once
 * 3. Remove this file after clearing
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const VIDROCK_PROGRESS_KEY = "@vidrock_progress";

export const clearAllData = async () => {
  try {
    console.log("🗑️ Clearing all continue watching data...");
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem(VIDROCK_PROGRESS_KEY);
    
    console.log("✅ All continue watching data cleared!");
    console.log("📝 You can now start fresh");
    
    return { success: true, message: "Data cleared successfully" };
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    return { success: false, error: error.message };
  }
};

// Alternative: Clear all AsyncStorage (use with caution!)
export const clearAllAsyncStorage = async () => {
  try {
    console.log("⚠️ WARNING: Clearing ALL AsyncStorage data...");
    await AsyncStorage.clear();
    console.log("✅ All AsyncStorage cleared!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error clearing AsyncStorage:", error);
    return { success: false, error: error.message };
  }
};
