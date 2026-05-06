import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface InputProps extends TextInputProps {
  icon?: any; 
  isPassword?: boolean;
}

export function Input({ icon: Icon, isPassword, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const[showPassword, setShowPassword] = useState(false);

  // Herbi Color Palette Constants
  const focusedColor = "#4D8035"; // Primary Olive Green
  const unfocusedColor = "#70A656"; // Softer Outline Green
  const textColor = "#22451C"; // Deepest Forest Green

  return (
    <View 
      className={`flex-row items-center rounded-full px-5 h-[56px] border mb-4 transition-all ${
        isFocused 
          ? "bg-white border-[#4D8035]" 
          : "bg-[#F5FAED] border-[#A2CFA3]" // Clean, soft greenish-white for unfocused
      }`}
    >
      {Icon && (
        <Icon 
          color={isFocused ? focusedColor : unfocusedColor} 
          size={22} 
          strokeWidth={isFocused ? 2 : 1.5} 
        />
      )}
      
      <TextInput
        // Replaced text-gray-900 with the deep forest green text
        className="flex-1 text-[16px] text-[#22451C] h-full font-medium ml-3"
        placeholderTextColor={unfocusedColor}
        secureTextEntry={isPassword && !showPassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {isPassword && (
        <TouchableOpacity 
          onPress={() => {
            Haptics.selectionAsync();
            setShowPassword(!showPassword);
          }}
          className="h-full justify-center pl-2"
        >
          {showPassword ? (
            <EyeOff color={isFocused ? focusedColor : unfocusedColor} size={22} strokeWidth={1.5} />
          ) : (
            <Eye color={isFocused ? focusedColor : unfocusedColor} size={22} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}