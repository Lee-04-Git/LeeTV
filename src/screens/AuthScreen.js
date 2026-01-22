import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { saveUserProfile } from "../services/supabaseService";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Movie poster images for the background collage - using reliable TMDB images
const POSTER_IMAGES = [
  "https://image.tmdb.org/t/p/w342/gKkl37BQuKTanygYQG1pyYgLVgf.jpg", // Lady and the Tramp
  "https://image.tmdb.org/t/p/w342/ykUEbfpkf8d0w49pHh0AD2KrT52.jpg", // Aladdin
  "https://image.tmdb.org/t/p/w342/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", // Beauty and the Beast
  "https://image.tmdb.org/t/p/w342/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg", // Tangled
  "https://image.tmdb.org/t/p/w342/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", // The Mandalorian
  "https://image.tmdb.org/t/p/w342/wToO8opxkGwKgSfJ1JK8tGvkG6U.jpg", // Cruella
];

// Poster component with loading state
const PosterImage = ({ uri, style, extraStyle }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={[style, extraStyle, styles.posterWrapper]}>
      {!loaded && !error && (
        <View style={[StyleSheet.absoluteFill, styles.posterPlaceholder]}>
          <ActivityIndicator size="small" color="#5B4FCF" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.posterPlaceholder]}>
          <Ionicons name="image-outline" size={24} color="#444" />
        </View>
      )}
    </View>
  );
};

const AuthScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    // Skip authentication - allow anyone to sign in
    setLoading(true);
    
    try {
      // Create a mock user with the provided info or defaults
      const userName = fullName.trim() || email || "Guest User";
      
      // Save to Supabase user profile with mock data
      await saveUserProfile({
        name: userName,
        avatarSeed: Math.random().toString(36).substring(7),
        avatarColorIndex: Math.floor(Math.random() * 6),
      });

      // Navigate directly to UserProfile
      navigation.replace("UserProfile");
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Movie Posters Collage */}
      <View style={styles.posterGrid}>
        <View style={styles.posterRow}>
          {POSTER_IMAGES.slice(0, 3).map((uri, index) => (
            <PosterImage
              key={index}
              uri={uri}
              style={styles.posterImage}
              extraStyle={index === 1 ? styles.posterImageCenter : null}
            />
          ))}
        </View>
        <View style={styles.posterRow}>
          {POSTER_IMAGES.slice(3, 6).map((uri, index) => (
            <PosterImage
              key={index + 3}
              uri={uri}
              style={styles.posterImage}
              extraStyle={styles.posterImageBottom}
            />
          ))}
        </View>
      </View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(1,14,31,0.7)", "#010e1f", "#010e1f"]}
        locations={[0, 0.3, 0.5, 1]}
        style={styles.gradient}
      />

      {/* Logo at top */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>LeeTV+</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />

        {/* Login Title */}
        <Text style={styles.title}>Welcome to LeeTV+</Text>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              placeholderTextColor="#888"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>CONTINUE</Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              No account needed - just tap continue to start watching
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010e1f",
  },
  posterGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  posterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  posterImage: {
    width: width * 0.32,
    height: height * 0.25,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
    overflow: "hidden",
  },
  posterWrapper: {
    backgroundColor: "#0a1929",
    overflow: "hidden",
  },
  posterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1929",
  },
  posterImageCenter: {
    height: height * 0.28,
    marginTop: -20,
  },
  posterImageBottom: {
    height: height * 0.22,
    opacity: 0.7,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  spacer: {
    height: height * 0.42,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 50, 0.8)",
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(100, 100, 140, 0.3)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: "#7B68EE",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#5B4FCF",
    borderRadius: 30,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  signUpText: {
    color: "#888",
    fontSize: 14,
  },
  signUpLink: {
    color: "#7B68EE",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default AuthScreen;
