import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import apiClient from "../api/client";
import { auth } from "../services/firebase";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

interface AuthState {
  user: any | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),

  loginWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      set({ user: cred.user });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  registerWithEmail: async (firstName, lastName, email, password) => {
    set({ isLoading: true });
    try {
      // Step 1: Create Firebase Account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        // Step 2 & 3: Verification and Backend Handshake
        await sendEmailVerification(cred.user);
        await apiClient.post("/api/user/profile", {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
        });
      } catch (backendError) {
        await cred.user.delete();
        throw new Error(
          "Failed to save profile to database. Please try again.",
        );
      }

      set({ user: cred.user });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("No ID token found");
      }

      const googleCredential = GoogleAuthProvider.credential(
        userInfo.data.idToken,
      );

      // Step 1: Log into Firebase
      const cred = await signInWithCredential(auth, googleCredential);

      // Step 2: Parse the Google Display Name
      const fullName = cred.user.displayName || "";
      const nameParts = fullName.split(" ");
      const parsedFirstName = nameParts[0] || "";
      const parsedLastName =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Step 3: The Backend Handshake
      await apiClient.post("/api/user/profile", {
        firstName: parsedFirstName,
        lastName: parsedLastName,
        email: cred.user.email?.toLowerCase() || "",
      });

      // Step 4: Update Global State
      set({ user: cred.user });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
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
