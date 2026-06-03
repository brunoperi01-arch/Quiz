// App.js — Navigation principale de Mémoire

import React from "react";
import { StatusBar, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator }     from "@react-navigation/stack";
import { SafeAreaProvider }          from "react-native-safe-area-context";
import { GestureHandlerRootView }    from "react-native-gesture-handler";

import { Colors } from "./theme";
import AlbumsScreen              from "./screens/AlbumsScreen";
import AlbumDetailScreen         from "./screens/AlbumDetailScreen";
import {
  ImportScreen, BookScreen, SendScreen,
} from "./screens/ImportBookSendScreens";

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── HEADER STYLE ─────────────────────────────────────────────────────────────
const headerStyle = {
  backgroundColor: Colors.surface,
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
};
const headerTitleStyle = {
  color: Colors.cream,
  fontFamily: "Georgia",
  fontWeight: "700",
  fontSize: 18,
};
const headerTintColor = Colors.gold;

// ─── ALBUMS STACK ─────────────────────────────────────────────────────────────
function AlbumsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle, headerTitleStyle, headerTintColor }}>
      <Stack.Screen
        name="AlbumsList"
        component={AlbumsScreen}
        options={{ title: "Mes albums" }}
      />
      <Stack.Screen
        name="AlbumDetail"
        component={AlbumDetailScreen}
        options={({ route }) => ({ title: route.params?.album?.title || "Album" })}
      />
    </Stack.Navigator>
  );
}

// ─── TAB ICON ─────────────────────────────────────────────────────────────────
function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>
        {emoji}
      </Text>
      {focused && (
        <View style={{
          width: 18, height: 2, borderRadius: 1,
          backgroundColor: Colors.gold, marginTop: 2,
        }} />
      )}
    </View>
  );
}

// ─── MAIN TABS ────────────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor:   Colors.surface,
          borderTopColor:    Colors.border,
          borderTopWidth:    1,
          height:            80,
          paddingBottom:     20,
          paddingTop:        8,
        },
        tabBarActiveTintColor:   Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontSize:      10,
          fontWeight:    "600",
          letterSpacing: 0.5,
          marginTop:     2,
        },
        headerStyle,
        headerTitleStyle,
        headerTintColor,
      }}
    >
      <Tab.Screen
        name="AlbumsTab"
        component={AlbumsStack}
        options={{
          title: "Albums",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ImportTab"
        component={ImportScreen}
        options={{
          title: "Importer",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📥" focused={focused} />,
          headerTitle: "Importer mes photos",
        }}
      />
      <Tab.Screen
        name="BookTab"
        component={BookScreen}
        options={{
          title: "Livre",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
          headerTitle: "Mon livre photo",
        }}
      />
      <Tab.Screen
        name="SendTab"
        component={SendScreen}
        options={{
          title: "Envoyer",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚀" focused={focused} />,
          headerTitle: "Envoyer au Mac",
        }}
      />
    </Tab.Navigator>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary:    Colors.gold,
              background: Colors.bg,
              card:       Colors.surface,
              text:       Colors.cream,
              border:     Colors.border,
              notification: Colors.gold,
            },
          }}
        >
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
