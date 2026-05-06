import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import * as Haptics from "expo-haptics";

interface IconButtonProps extends TouchableOpacityProps {
  icon: any;
  size?: number;
  variant?: "filled" | "ghost";
}

export function IconButton({
  icon: Icon,
  size = 22,
  variant = "ghost",
  onPress,
  ...props
}: IconButtonProps) {
  const isFilled = variant === "filled";

  const handlePress = (e: any) => {
    Haptics.selectionAsync();
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className={`w-[44px] h-[44px] rounded-full items-center justify-center ${
        isFilled ? "bg-[#4D8035]" : "bg-[#EAF3D5]"
      }`}
      {...props}
    >
      <Icon
        size={size}
        color={isFilled ? "#ffffff" : "#4D8035"}
        strokeWidth={1.8}
      />
    </TouchableOpacity>
  );
}