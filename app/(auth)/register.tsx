import { Link, useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();

  const { registerWithEmail, loginWithGoogle, isLoading } = useAuthStore();

  // Local Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    setErrorMessage("");

    // Local UI Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return setErrorMessage("All fields are required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setErrorMessage("Please enter a valid email address.");
    }

    if (password.length < 6) {
      return setErrorMessage("Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      return setErrorMessage("Passwords do not match.");
    }

    // passing the data to zustand
    try {
      await registerWithEmail(firstName, lastName, email, password);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Invalid email format.");
      } else if (error.code === "auth/network-request-failed") {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage(
          error.message || "Something went wrong. Please try again.",
        );
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
          Create Account
        </Text>
        <Text className="text-base text-gray-500">Join HanapDamo today.</Text>
      </View>

      {/* Error Message Display */}
      {errorMessage ? (
        <View className="bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
          <Text className="text-red-600 text-sm">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="space-y-4">
        {/* Name Row: Side-by-side using flex-row */}
        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              First Name
            </Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Jared"
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Last Name
            </Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Smith"
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
            />
          </View>
        </View>

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
            placeholder="Min. 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </Text>
          <TextInput
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
            placeholder="Re-type password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Main Register Button */}
      <TouchableOpacity
        onPress={handleRegister}
        disabled={isLoading}
        className={`mt-8 w-full py-4 rounded-xl items-center ${isLoading ? "bg-green-400" : "bg-green-600"}`}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={loginWithGoogle}
        disabled={isLoading}
        className="mt-4 w-full py-4 rounded-xl items-center border border-gray-300 flex-row justify-center space-x-2"
      >
        <Text className="text-gray-700 text-lg font-semibold">
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Navigate to Login */}
      <View className="flex-row justify-center mt-6 gap-1">
        <Text className="text-gray-600">Already have an account?</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity disabled={isLoading}>
            <Text className="text-green-600 font-semibold">Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
