import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    // Navigate to user profile selection
    navigation.navigate("UserProfile");
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
        <TextInput
          style={styles.input}
          placeholder="Username/Email/Phone"
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

        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>New to LeeTV? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Sign up now</Text>
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
