import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

import AuthScreen from "../screens/AuthScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import ShowDetailsScreen from "../screens/ShowDetailsScreen";
import SearchScreen from "../screens/SearchScreen";
import MyListScreen from "../screens/MyListScreen";
import FranchiseScreen from "../screens/FranchiseScreen";
import FranchiseCategoryScreen from "../screens/FranchiseCategoryScreen";
import NetflixScreen from "../screens/NetflixScreen";
import MaxScreen from "../screens/MaxScreen";
import AppleTVScreen from "../screens/AppleTVScreen";
import DisneyPlusScreen from "../screens/DisneyPlusScreen";
import ParamountScreen from "../screens/ParamountScreen";
import ESPNScreen from "../screens/ESPNScreen";
import USANetworkScreen from "../screens/USANetworkScreen";
import TheCWScreen from "../screens/TheCWScreen";
import VideoPlayerScreen from "../screens/VideoPlayerScreen";
import CategoryContentScreen from "../screens/CategoryContentScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "slide_from_right",
          animationDuration: 300,
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="ShowDetails"
              component={ShowDetailsScreen}
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="MyList" component={MyListScreen} />
            <Stack.Screen name="Franchise" component={FranchiseScreen} />
            <Stack.Screen name="Netflix" component={NetflixScreen} />
            <Stack.Screen name="Max" component={MaxScreen} />
            <Stack.Screen name="AppleTV" component={AppleTVScreen} />
            <Stack.Screen name="DisneyPlus" component={DisneyPlusScreen} />
            <Stack.Screen name="Paramount" component={ParamountScreen} />
            <Stack.Screen name="ESPN" component={ESPNScreen} />
            <Stack.Screen name="USANetwork" component={USANetworkScreen} />
            <Stack.Screen name="TheCW" component={TheCWScreen} />
            <Stack.Screen name="FranchiseCategory" component={FranchiseCategoryScreen} />
            <Stack.Screen name="CategoryContent" component={CategoryContentScreen} />
            <Stack.Screen
              name="VideoPlayer"
              component={VideoPlayerScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "fullScreenModal",
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ animation: "fade" }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
