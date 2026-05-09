/**
 * src/components/profile/profile-avatar.tsx
 * Renders the user avatar with an edit-button overlay.
 */
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  photoURL: string | null;
  displayName: string;
  uploading: boolean;
  onEditPress: () => void;
}

export function ProfileAvatar({ photoURL, displayName, uploading, onEditPress }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        <View 
          style={{
            backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)",
            borderWidth: StyleSheet.hairlineWidth,
          }}
          className="w-24 h-24 rounded-full overflow-hidden items-center justify-center"
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text 
              style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }} 
              className="text-3xl"
            >
              {initials}
            </Text>
          )}
        </View>

        {/* Edit button overlay */}
        <AnimatedTouchable
          onPressIn={() => {
            scale.value = withSpring(0.85, { damping: 14, stiffness: 320 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 14, stiffness: 320 });
          }}
          onPress={onEditPress}
          disabled={uploading}
          activeOpacity={1}
          style={[
            {
              backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)",
              borderWidth: StyleSheet.hairlineWidth,
            },
            animStyle
          ]}
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full items-center justify-center"
        >
          {uploading ? (
            <ActivityIndicator size="small" color={isDark ? "#F8FAFC" : "#22451C"} />
          ) : (
            <Feather name="camera" size={14} color={isDark ? "rgba(248,250,252,0.85)" : "#22451C"} />
          )}
        </AnimatedTouchable>
      </View>
    </View>
  );
}
