import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthStore } from "../../src/store/useAuthStore";

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuthStore();

  // local form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailLogin = async () => {
    setErrorMessage("");

    // Local UI Validation
    if (!email || !password) {
      return setErrorMessage("Please enter both email and password.");
    }

    // login fires here
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErrorMessage("Incorrect email or password.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Too many failed attempts. Try again later.");
      } else if (error.code === "auth/network-request-failed") {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white justify-center px-6"
    >
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Welcome Back
        </Text>
        <Text className="text-base text-gray-500">Log in to HanapDamo.</Text>
      </View>

      {/* Error Message Display */}
      {errorMessage ? (
        <View className="bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
          <Text className="text-red-600 text-sm">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="jared@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Password
          </Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Main Login Button */}
      <TouchableOpacity
        onPress={handleEmailLogin}
        disabled={isLoading}
        className={`mt-8 w-full py-4 rounded-xl items-center ${isLoading ? "bg-green-400" : "bg-green-600"}`}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Log In</Text>
        )}
      </TouchableOpacity>

      {/* Google Sign-In Button */}
      <TouchableOpacity
        onPress={loginWithGoogle}
        disabled={isLoading}
        className="mt-4 w-full py-4 rounded-xl items-center border border-gray-300 flex-row justify-center space-x-2"
      >
        <Text className="text-gray-700 text-lg font-semibold">
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Navigate to Register */}
      <View className="flex-row justify-center mt-8 gap-1">
        <Text className="text-gray-600">Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity disabled={isLoading}>
            <Text className="text-green-600 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
