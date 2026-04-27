import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import SyncPromptModal from "../src/components/global/SyncPromptModal";
import SyncStatusBanner from "../src/components/global/SyncStatusBanner";
import { useNetworkSync } from "../src/hooks/useNetworkSync";
import { auth } from "../src/services/firebase";
import { useAuthStore } from "../src/store/useAuthStore";
import { useNetworkStore } from "../src/store/useNetworkStore";

export default function RootLayout() {
  const { user, setUser } = useAuthStore();

  // Phase 4: Network sync hook — listens for offline→online transitions
  // and triggers the sync prompt modal when pending scans exist.
  const { showSyncPrompt, dismissSyncPrompt } = useNetworkSync();

  const [isInitializing, setIsInitializing] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Phase 4: Start the NetInfo listener so offline→online transitions are detected.
  // Without this, the reconnect callback in useNetworkSync would never fire.
  useEffect(() => {
    useNetworkStore.getState().startMonitoring();
    return () => {
      useNetworkStore.getState().stopMonitoring();
    };
  }, []);

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

  // 3. YOUR ORIGINAL STACK + SYNC MODAL OVERLAY
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {/* Phase 4: Global sync modal — only shown when user is logged in */}
      {user && user.emailVerified && (
        <SyncPromptModal
          visible={showSyncPrompt}
          onDismiss={dismissSyncPrompt}
        />
      )}

      {/* Phase 4: Background sync status banner — slides in during upload */}
      {user && user.emailVerified && <SyncStatusBanner />}
    </>
  );
}
