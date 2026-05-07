import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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
  // Load the organic plantic fonts
  const [fontsLoaded, error] = useFonts({
    'Quicksand_400Regular': Quicksand_400Regular,
    'Quicksand_500Medium': Quicksand_500Medium,
    'Quicksand_600SemiBold': Quicksand_600SemiBold,
    'Quicksand_700Bold': Quicksand_700Bold,
  });

  // Catch and throw any font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide the splash screen once fonts are fully ready
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Do not render the app until fonts are loaded
  if (!fontsLoaded) {
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