import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";
import { useAuthStore } from "../state/authStore";
import { PhoneAuthScreen } from "../features/auth/PhoneAuthScreen";
import { NewTripScreen } from "../features/trips/NewTripScreen";
import { CaptureScreen } from "../features/capture/CaptureScreen";
import { Tabs } from "./Tabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text },
};

export function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        // Signed out → only the phone auth screen exists.
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={PhoneAuthScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="NewTrip" component={NewTripScreen} options={{ title: "New trip" }} />
          <Stack.Screen
            name="Capture"
            component={CaptureScreen}
            options={{ title: "Live proof", headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
