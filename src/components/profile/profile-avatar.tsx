/**
 * src/components/profile/profile-avatar.tsx
 * Renders the user avatar with an edit-button overlay.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  photoURL: string | null;
  displayName: string;
  uploading: boolean;
  onEditPress: () => void;
}

export function ProfileAvatar({ photoURL, displayName, uploading, onEditPress }: Props) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="items-center mb-6">
      <View className="relative">
        {/* Avatar */}
        <View className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-white shadow-md overflow-hidden items-center justify-center">
          {photoURL ? (
            <Image source={{ uri: photoURL }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-3xl font-bold text-emerald-700">{initials}</Text>
          )}
        </View>

        {/* Edit button overlay */}
        <TouchableOpacity
          onPress={onEditPress}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full items-center justify-center border-2 border-white shadow-sm"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="camera" size={14} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
