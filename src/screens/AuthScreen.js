import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../config/firebase";
import colors from "../constants/colors";

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Auto-login happens, listener in AppNavigator handles navigation
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Listener in AppNavigator handles navigation
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* LeeTV Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>LeeTV</Text>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <Text style={styles.headerText}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.signInButtonText}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        {!isSignUp && (
          <TouchableOpacity style={styles.rememberMeContainer}>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>
        )}

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>
            {isSignUp ? "Already have an account? " : "New to LeeTV? "}
          </Text>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.signUpLink}>
              {isSignUp ? "Sign in now" : "Sign up now"}
            </Text>
          </TouchableOpacity>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 80,
  },
  logo: {
    fontSize: 56,
    fontWeight: "bold",
    color: colors.netflixRed,
    letterSpacing: 6,
    textShadow: "0px 4px 12px rgba(229, 9, 20, 0.5)",
  },
  headerText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 28,
  },
  formContainer: {
    paddingHorizontal: 40,
    maxWidth: 450,
    alignSelf: "center",
    width: "100%",
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
    padding: 18,
    marginBottom: 16,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  signInButton: {
    backgroundColor: colors.netflixRed,
    borderRadius: 6,
    padding: 18,
    alignItems: "center",
    marginTop: 16,
    boxShadow: "0px 4px 12px rgba(229, 9, 20, 0.4)",
    elevation: 4,
  },
  signInButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  rememberMeContainer: {
    marginTop: 20,
    alignItems: "flex-start",
  },
  rememberMeText: {
    color: colors.gray,
    fontSize: 14,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  signUpText: {
    color: colors.gray,
    fontSize: 14,
  },
  signUpLink: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default AuthScreen;
