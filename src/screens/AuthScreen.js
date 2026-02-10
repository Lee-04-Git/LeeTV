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
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    if (isSignUp && !fullName.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update Firebase profile with display name
        await updateProfile(userCredential.user, {
          displayName: fullName.trim(),
        });

        // Save to Supabase user profile
        await saveUserProfile({
          name: fullName.trim(),
          avatarSeed: Math.random().toString(36).substring(7),
          avatarColorIndex: Math.floor(Math.random() * 6),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      let errorMessage = "An error occurred.";
      if (error.code === "auth/invalid-email")
        errorMessage = "Invalid email address.";
      if (error.code === "auth/user-disabled")
        errorMessage = "User account disabled.";
      if (error.code === "auth/user-not-found")
        errorMessage = "User not found.";
      if (error.code === "auth/wrong-password")
        errorMessage = "Incorrect password.";
      if (error.code === "auth/email-already-in-use")
        errorMessage = "Email already in use.";
      if (error.code === "auth/weak-password")
        errorMessage = "Password is too weak.";

      Alert.alert("Authentication Error", errorMessage);
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
        <Text style={styles.title}>{isSignUp ? "Sign Up" : "Login"}</Text>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Full Name Input - Only for Sign Up */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          {!isSignUp && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>
                {isSignUp ? "SIGN UP" : "LOGIN"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              {isSignUp ? "Already have an account? " : "New to LeeTV+? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.signUpLink}>
                {isSignUp ? "Sign in" : "Sign up"}
              </Text>
            </TouchableOpacity>
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
