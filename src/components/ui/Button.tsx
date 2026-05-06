import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  variant?: "primary" | "outline";
}

export function Button({ title, isLoading, variant = "primary", className, ...props }: ButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isLoading || props.disabled}
      className={`h-[56px] rounded-full items-center justify-center flex-row w-full mb-4 ${
        isPrimary ? "bg-[#4D8035]" : "bg-transparent border-[1.5px] border-[#70A656]"
      } ${isLoading && isPrimary ? "bg-[#22451C]" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? "#ffffff" : "#4D8035"} />
      ) : (
        <Text className={`text-[16px] font-bold tracking-wide ${
          isPrimary ? "text-white" : "text-[#22451C]"
        }`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}