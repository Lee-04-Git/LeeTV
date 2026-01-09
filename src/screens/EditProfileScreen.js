import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile, saveUserProfile } from "../services/supabaseService";

const { width } = Dimensions.get("window");

// Avatar options
const AVATAR_OPTIONS = [
  { seed: "felix" },
  { seed: "aneka" },
  { seed: "sarah" },
  { seed: "mike" },
  { seed: "emma" },
  { seed: "john" },
  { seed: "oliver" },
  { seed: "sophia" },
];

export default function EditProfileScreen({ navigation }) {
  const [profileName, setProfileName] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabaseProfile = await getUserProfile();
      if (supabaseProfile) {
        setProfileName(supabaseProfile.name || "");
        const avatarIndex = AVATAR_OPTIONS.findIndex(
          (a) => a.seed === supabaseProfile.avatarSeed
        );
        if (avatarIndex >= 0) {
          setSelectedAvatarIndex(avatarIndex);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileName.trim()) {
      Alert.alert("Name Required", "Please enter your name");
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({
        name: profileName.trim(),
        avatarSeed: AVATAR_OPTIONS[selectedAvatarIndex].seed,
        avatarColorIndex: selectedAvatarIndex,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUrl = (seed, size = 200) => {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&size=${size}&backgroundColor=c0aede`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B4FCF" />
      </View>
    );
  }

  const selectedAvatar = AVATAR_OPTIONS[selectedAvatarIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Choose Your</Text>
          <Text style={styles.title}>Avatar</Text>

          {/* Large Avatar Preview */}
          <View style={styles.avatarPreviewSection}>
            <View style={styles.avatarPreviewContainer}>
              <Image
                source={{ uri: getAvatarUrl(selectedAvatar.seed, 300) }}
                style={styles.avatarPreview}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Username Section */}
          <View style={styles.usernameSection}>
            <Text style={styles.usernameLabel}>Username</Text>
            <View style={styles.usernameRow}>
              {isEditingName ? (
                <TextInput
                  style={styles.usernameInput}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter name"
                  placeholderTextColor="#666"
                  maxLength={20}
                  autoCapitalize="words"
                  autoFocus
                  onBlur={() => setIsEditingName(false)}
                  onSubmitEditing={() => setIsEditingName(false)}
                />
              ) : (
                <Text style={styles.usernameText}>{profileName || "Your Name"}</Text>
              )}
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avatar Label */}
          <Text style={styles.avatarLabel}>Avatar</Text>

          {/* Avatar Selection Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarRow}
          >
            {AVATAR_OPTIONS.map((avatar, index) => {
              const isSelected = selectedAvatarIndex === index;
              return (
                <TouchableOpacity
                  key={avatar.seed}
                  style={[
                    styles.avatarOption,
                    isSelected && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setSelectedAvatarIndex(index)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: getAvatarUrl(avatar.seed, 100) }}
                    style={styles.avatarOptionImage}
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010e1f",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#010e1f",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 44,
  },
  avatarPreviewSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  avatarPreviewContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#a5b4fc",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarPreview: {
    width: 180,
    height: 180,
  },
  usernameSection: {
    marginBottom: 32,
  },
  usernameLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  usernameInput: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#7B68EE",
    paddingBottom: 4,
  },
  editButton: {
    padding: 8,
  },
  avatarLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  avatarRow: {
    paddingVertical: 8,
    gap: 12,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    marginRight: 12,
  },
  avatarOptionSelected: {
    borderColor: "#7B68EE",
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  checkmark: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#5B4FCF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#5B4FCF",
    marginTop: 40,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
