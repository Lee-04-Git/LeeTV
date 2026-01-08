import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import colors from "../constants/colors";
import { ArrowLeftIcon, CheckIcon } from "../components/Icons";
import { getUserProfile, saveUserProfile } from "../services/supabaseService";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = (width - 80) / 4;

// Avatar seeds for DiceBear avataaars (96 unique avatars)
const AVATAR_SEEDS = [
  "felix",
  "aneka",
  "john",
  "jane",
  "mike",
  "sarah",
  "alex",
  "emma",
  "oliver",
  "sophia",
  "liam",
  "ava",
  "noah",
  "isabella",
  "william",
  "mia",
  "james",
  "charlotte",
  "benjamin",
  "amelia",
  "lucas",
  "harper",
  "henry",
  "evelyn",
  "alexander",
  "abigail",
  "sebastian",
  "emily",
  "jack",
  "elizabeth",
  "aiden",
  "sofia",
  "owen",
  "avery",
  "samuel",
  "ella",
  "ryan",
  "scarlett",
  "nathan",
  "grace",
  "caleb",
  "chloe",
  "christian",
  "victoria",
  "dylan",
  "riley",
  "landon",
  "aria",
  "matthew",
  "camila",
  "leo",
  "penelope",
  "jackson",
  "layla",
  "carter",
  "zoey",
  "wyatt",
  "nora",
  "david",
  "lily",
  "elijah",
  "eleanor",
  "logan",
  "hannah",
  "ezra",
  "lillian",
  "gabriel",
  "addison",
  "julian",
  "aubrey",
  "mateo",
  "natalie",
  "anthony",
  "brooklyn",
  "jaxon",
  "lucy",
  "lincoln",
  "audrey",
  "joshua",
  "bella",
  "christopher",
  "ellie",
  "andrew",
  "stella",
  "theodore",
  "skylar",
  "jose",
  "madison",
  "hunter",
  "leah",
  "jordan",
  "hazel",
  "adam",
  "violet",
  "eli",
  "aurora",
];

// Background colors for avatars (Netflix-inspired palette)
const AVATAR_BG_COLORS = [
  { name: "Blue Steel", color: "#1B264F" },
  { name: "Purple Rain", color: "#5E2BFF" },
  { name: "Ocean Blue", color: "#00A8E1" },
  { name: "Netflix Red", color: "#E50914" },
  { name: "Forest Green", color: "#46D369" },
  { name: "Golden Hour", color: "#F5C518" },
  { name: "Sunset Orange", color: "#FF6B35" },
  { name: "Royal Purple", color: "#8644A2" },
  { name: "Deep Ocean", color: "#0077B6" },
  { name: "Emerald", color: "#2D9A46" },
  { name: "Bronze", color: "#D4A012" },
  { name: "Crimson", color: "#B81D24" },
  { name: "Turquoise", color: "#00C9A7" },
  { name: "Pink Sunset", color: "#FF6B9D" },
  { name: "Midnight", color: "#2C3E50" },
  { name: "Coral", color: "#FF7F50" },
];

export default function EditProfileScreen({ navigation }) {
  const [profileName, setProfileName] = useState("");
  const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabaseProfile = await getUserProfile();
      if (supabaseProfile) {
        setProfileName(supabaseProfile.name || "");
        setSelectedSeed(supabaseProfile.avatarSeed || AVATAR_SEEDS[0]);
        setSelectedColorIndex(supabaseProfile.avatarColorIndex || 0);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profileName.trim()) {
      Alert.alert(
        "Profile Name Required",
        "Please enter a name for your profile"
      );
      return;
    }

    setSaving(true);
    try {
      await saveUserProfile({
        name: profileName.trim(),
        avatarSeed: selectedSeed,
        avatarColorIndex: selectedColorIndex,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUrl = (seed, size = 150) => {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&size=${size}&backgroundColor=transparent`;
  };

  const renderAvatarItem = ({ item, index }) => {
    const isSelected = selectedSeed === item;
    return (
      <TouchableOpacity
        style={[styles.avatarItem, isSelected && styles.avatarItemSelected]}
        onPress={() => setSelectedSeed(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatarWrapper,
            {
              backgroundColor:
                AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length],
            },
          ]}
        >
          <Image
            source={{ uri: getAvatarUrl(item, 150) }}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>
        {isSelected && (
          <View style={styles.checkmarkBadge}>
            <CheckIcon size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item, index }) => {
    const isSelected = selectedColorIndex === index;
    return (
      <TouchableOpacity
        style={[styles.colorItem, isSelected && styles.colorItemSelected]}
        onPress={() => setSelectedColorIndex(index)}
        activeOpacity={0.7}
      >
        <View style={[styles.colorCircle, { backgroundColor: item.color }]}>
          {isSelected && <Text style={styles.checkmarkText}>✓</Text>}
        </View>
        <Text
          style={[styles.colorName, isSelected && styles.colorNameSelected]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeftIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview Avatar */}
      <View style={styles.previewSection}>
        <View
          style={[
            styles.previewAvatarContainer,
            { backgroundColor: AVATAR_BG_COLORS[selectedColorIndex].color },
          ]}
        >
          <Image
            source={{ uri: getAvatarUrl(selectedSeed, 200) }}
            style={styles.previewAvatarImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.previewName}>{profileName || "Your Name"}</Text>
        <Text style={styles.previewColorName}>
          {AVATAR_BG_COLORS[selectedColorIndex].name}
        </Text>
      </View>

      {/* Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Profile Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.nameInput}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Enter your name"
            placeholderTextColor="#555555"
            maxLength={20}
            autoCapitalize="words"
          />
          <Text style={styles.charCount}>{profileName.length}/20</Text>
        </View>
      </View>

      {/* Background Color Selection */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Background Color</Text>
      </View>
      <FlatList
        data={AVATAR_BG_COLORS}
        renderItem={renderColorItem}
        keyExtractor={(item, index) => `color-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorList}
      />

      {/* Avatar Selection */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Choose Avatar ({AVATAR_SEEDS.length})
        </Text>
        <Text style={styles.sectionSubtitle}>Scroll to see all options</Text>
      </View>
      <FlatList
        data={AVATAR_SEEDS}
        renderItem={renderAvatarItem}
        keyExtractor={(item) => item}
        numColumns={4}
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
        style={styles.avatarList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#141414",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  previewSection: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  previewAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  previewAvatarImage: {
    width: 100,
    height: 100,
  },
  previewName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  previewColorName: {
    color: "#808080",
    fontSize: 13,
  },
  inputSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputLabel: {
    color: "#B3B3B3",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    paddingHorizontal: 16,
  },
  nameInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 14,
  },
  charCount: {
    color: "#666666",
    fontSize: 11,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: "#B3B3B3",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: "#666666",
    fontSize: 11,
    marginTop: 4,
  },
  colorList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 8,
  },
  colorItem: {
    alignItems: "center",
    marginHorizontal: 10,
    opacity: 0.6,
  },
  colorItemSelected: {
    opacity: 1,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 3,
    borderColor: "transparent",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  colorName: {
    color: "#666666",
    fontSize: 10,
    textAlign: "center",
    width: 64,
  },
  colorNameSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  avatarList: {
    flex: 1,
  },
  avatarGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
    position: "relative",
  },
  avatarItemSelected: {
    borderColor: "#FFFFFF",
  },
  avatarWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "80%",
    height: "80%",
  },
  checkmarkBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.netflixRed,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#141414",
  },
});
