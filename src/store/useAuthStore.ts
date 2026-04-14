import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import { auth } from "../services/firebase";

// Replace with your Web Client ID from Step 1
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

interface AuthState {
  user: any | null;
  isLoading: boolean;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  loginWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      set({ user: cred.user });
    } finally {
      set({ isLoading: false });
    }
  },

  registerWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: cred.user });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const googleCredential = GoogleAuthProvider.credential(
        userInfo.data?.idToken,
      );
      const cred = await signInWithCredential(auth, googleCredential);
      set({ user: cred.user });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    await GoogleSignin.signOut();
    set({ user: null });
  },
}));
