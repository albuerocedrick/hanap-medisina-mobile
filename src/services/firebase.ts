import { initializeApp } from "firebase/app";
// @ts-ignore - The function exists in the RN bundle, but TS definitions are missing it
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID,
};

// 1. Initialize the core Firebase App
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// 2. Initialize Firebase Auth specifically for React Native
// This ensures that when a user closes HanapDamo and opens it tomorrow,
// they are still logged in.
let auth: any;

try {
  const { getReactNativePersistence } = require("firebase/auth");

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // fallback if already initialized
  auth = getAuth(app);
}

// Export the auth object so your Zustand store can use it
export { auth };
