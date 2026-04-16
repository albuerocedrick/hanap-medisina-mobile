import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import { auth } from "../src/services/firebase";
import { useAuthStore } from "../src/store/useAuthStore";

export default function RootLayout() {
  const { user, setUser } = useAuthStore();

  const [isInitializing, setIsInitializing] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (isInitializing) setIsInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isVerifyScreen = segments[1] === "verify-email";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (user) {
      if (!user.emailVerified) {
        if (!isVerifyScreen) {
          router.replace("/(auth)/verify-email");
        }
      } else if (user.emailVerified) {
        if (inAuthGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, segments, isInitializing]);

  if (isInitializing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // 3. YOUR ORIGINAL STACK
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
