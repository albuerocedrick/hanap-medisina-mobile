import { sendEmailVerification } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../src/services/firebase";
import { useAuthStore } from "../../src/store/useAuthStore"; // Adjust path if needed

export default function VerifyEmailScreen() {
  const { user, logout, setUser } = useAuthStore();

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // The Refresh Function
  const handleCheckVerification = async () => {
    setStatusMessage("");
    setIsChecking(true);

    // reloads the user object
    try {
      await auth.currentUser?.reload();

      if (auth.currentUser?.emailVerified) {
        setUser({ ...auth.currentUser });
      } else {
        setStatusMessage(
          "We checked, but your email isn't verified yet. Please check your inbox or spam folder.",
        );
      }
    } catch (error: any) {
      console.error("Error checking verification:", error);
      setStatusMessage("Failed to connect to the server. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // 🟡 The "Resend" Function
  const handleResendEmail = async () => {
    setStatusMessage("");
    setIsResending(true);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatusMessage("A new verification email has been sent!");
      }
    } catch (error: any) {
      console.error("Error resending email:", error);
      if (error.code === "auth/too-many-requests") {
        setStatusMessage(
          "We just sent one! Please wait a few minutes before trying again.",
        );
      } else {
        setStatusMessage("Failed to resend email. Please try again later.");
      }
    } finally {
      setIsResending(false);
    }
  };

  // The Escape Hatch
  const handleCancel = async () => {
    await logout();
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
          <Text className="text-4xl">✉️</Text>
        </View>

        <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Check your email
        </Text>
        <Text className="text-base text-gray-500 text-center px-4">
          We sent a verification link to{" "}
          <Text className="font-bold text-gray-800">{user?.email}</Text>. Please
          click the link to activate your HanapDamo account.
        </Text>
      </View>

      {/* Status Message Display */}
      {statusMessage ? (
        <View
          className={`p-4 rounded-lg mb-6 border ${statusMessage.includes("sent") ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
        >
          <Text
            className={`text-sm text-center ${statusMessage.includes("sent") ? "text-green-700" : "text-amber-700"}`}
          >
            {statusMessage}
          </Text>
        </View>
      ) : null}

      <View className="space-y-4 w-full">
        {/* Check Status Button */}
        <TouchableOpacity
          onPress={handleCheckVerification}
          disabled={isChecking}
          className={`w-full py-4 rounded-xl items-center ${isChecking ? "bg-green-400" : "bg-green-600"}`}
        >
          {isChecking ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              I've verified my email
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Email Button */}
        <TouchableOpacity
          onPress={handleResendEmail}
          disabled={isResending}
          className="w-full py-4 rounded-xl items-center bg-gray-100"
        >
          {isResending ? (
            <ActivityIndicator color="#4b5563" />
          ) : (
            <Text className="text-gray-700 text-lg font-semibold">
              Resend verification email
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* The Cancel/Logout Escape Hatch */}
      <TouchableOpacity onPress={handleCancel} className="mt-12 items-center">
        <Text className="text-red-500 font-semibold text-base">
          Cancel & Return to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
