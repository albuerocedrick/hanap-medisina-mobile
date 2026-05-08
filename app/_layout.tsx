import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/services/firebase';
import { useAuthStore } from '../src/store/useAuthStore';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

// Ensure your global CSS is imported for NativeWind to work
import "../global.css"; 

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    'Quicksand_400Regular': Quicksand_400Regular,
    'Quicksand_500Medium': Quicksand_500Medium,
    'Quicksand_600SemiBold': Quicksand_600SemiBold,
    'Quicksand_700Bold': Quicksand_700Bold,
  });

  const { user, setUser } = useAuthStore();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Catch and throw any font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return subscriber; 
  }, [setUser]);

  // Handle routing based on auth state
  useEffect(() => {
    if (!isAuthReady || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // If not logged in and not in the auth group, force them to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // If logged in and inside the auth group, send them to tabs
      router.replace('/(tabs)');
    }
  }, [user, isAuthReady, fontsLoaded, segments, router]);

  // Hide the splash screen once fonts and auth are fully ready
  useEffect(() => {
    if (fontsLoaded && isAuthReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthReady]);

  // Do not render the app until fonts and auth state are loaded
  if (!fontsLoaded || !isAuthReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth Group */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      
      {/* Tabs Group */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 404 Fallback */}
      <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
    </Stack>
  );
}