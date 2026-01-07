import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import { UserIcon, PlusIcon } from "../components/Icons";

const UserProfileScreen = ({ navigation }) => {
  const profiles = [
    { id: 1, name: "User 1", color: "#FFD700", icon: "user" },
    { id: 2, name: "User 2", color: "#FF6B6B", icon: "user" },
    { id: 3, name: "User 3", color: "#4ECDC4", icon: "user" },
    { id: 4, name: "Add Profile", color: colors.inputBackground, icon: "plus" },
  ];

  const handleProfileSelect = (profile) => {
    if (profile.id !== 4) {
      navigation.navigate("Home");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* LeeTV Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>LeeTV</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Who's Watching?</Text>

        <View style={styles.profilesContainer}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.profileItem}
              onPress={() => handleProfileSelect(profile)}
            >
              <View style={[styles.avatar, { backgroundColor: profile.color }]}>
                {profile.icon === "user" ? (
                  <UserIcon size={48} color={colors.white} />
                ) : (
                  <PlusIcon size={48} color={colors.white} />
                )}
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.netflixRed,
    letterSpacing: 6,
    textShadow: "0px 4px 12px rgba(229, 9, 20, 0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 60,
    letterSpacing: 1,
    textShadow: "0px 2px 8px rgba(0, 0, 0, 0.3)",
  },
  profilesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 700,
    gap: 20,
  },
  profileItem: {
    alignItems: "center",
    margin: 10,
    width: 140,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "transparent",
    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.4)",
    elevation: 6,
  },
  profileName: {
    color: colors.lightGray,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});

export default UserProfileScreen;
