import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "../theme";
import { MapScreen } from "../features/map/MapScreen";
import { LogbookScreen } from "../features/logbook/LogbookScreen";
import { LeaderboardScreen } from "../features/leaderboard/LeaderboardScreen";
import { FriendsScreen } from "../features/friends/FriendsScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Map: "🗺️",
  Logbook: "📖",
  Leaderboard: "🏆",
  Friends: "👥",
  Profile: "⚙️",
};

export function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
            {ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Logbook" component={LogbookScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
