import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../src/store/useAuthStore"; // Adjust path if needed

export default function ProfileScreen() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of HanapDamo?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* The Log Out Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="w-full py-4 rounded-xl items-center bg-red-100 border border-red-200 mt-auto mb-10"
      >
        <Text className="text-red-600 text-lg font-semibold">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
