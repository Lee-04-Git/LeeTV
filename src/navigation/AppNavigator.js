import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import UserProfileScreen from "../screens/UserProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HomeScreen from "../screens/HomeScreen";
import ShowDetailsScreen from "../screens/ShowDetailsScreen";
import SearchScreen from "../screens/SearchScreen";
import MyListScreen from "../screens/MyListScreen";
import VideoPlayerScreen from "../screens/VideoPlayerScreen";
import CategoryContentScreen from "../screens/CategoryContentScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="UserProfile"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "slide_from_right",
          animationDuration: 300,
        }}
      >
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
        <Stack.Screen name="CategoryContent" component={CategoryContentScreen} />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{
            animation: "slide_from_bottom",
            presentation: "fullScreenModal",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
