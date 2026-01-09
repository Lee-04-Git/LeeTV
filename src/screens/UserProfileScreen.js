import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import colors from "../constants/colors";
import { PencilIcon } from "../components/Icons";
import { getUserProfile } from "../services/supabaseService";

// Netflix-style avatar colors
const AVATAR_COLORS = [
  ["#1B264F", "#274690"],
  ["#5E2BFF", "#8644A2"],
  ["#00A8E1", "#0077B6"],
  ["#E50914", "#B81D24"],
  ["#46D369", "#2D9A46"],
  ["#F5C518", "#D4A012"],
];

const UserProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: "User",
    avatarSeed: "user1",
    avatarColorIndex: 0,
  });
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const supabaseProfile = await getUserProfile();
      if (supabaseProfile) {
        setProfile({
          name: supabaseProfile.name || "User",
          avatarSeed: supabaseProfile.avatarSeed || "user1",
          avatarColorIndex: supabaseProfile.avatarColorIndex || 0,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut(auth);
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleContinue = () => {
    navigation.navigate("Home");
  };

  // Generate DiceBear avatar URL
  const getAvatarUrl = (seed, size = 150) => {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&size=${size}&backgroundColor=transparent`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LeeTV</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Who's Watching?</Text>

        {/* Profile Card - Click to continue */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor:
                    AVATAR_COLORS[profile.avatarColorIndex]?.[0] || "#1B264F",
                },
              ]}
            >
              <Image
                source={{ uri: getAvatarUrl(profile.avatarSeed, 200) }}
                style={styles.avatarImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Manage Profile Button */}
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.manageText}>Manage Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button at Bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010e1f",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.netflixRed,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 40,
    fontWeight: "400",
  },
  profileCard: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarTouchable: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
  },
  profileName: {
    color: "#808080",
    fontSize: 16,
    marginTop: 12,
    fontWeight: "400",
  },
  editIconButton: {
    marginTop: 8,
    padding: 8,
  },
  pencilIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(42, 42, 42, 0.6)",
    borderWidth: 2,
    borderColor: "#808080",
    justifyContent: "center",
    alignItems: "center",
  },
  manageButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#808080",
    borderRadius: 4,
  },
  manageText: {
    color: "#808080",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 1,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  signOutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#808080",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  signOutText: {
    color: "#808080",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UserProfileScreen;
