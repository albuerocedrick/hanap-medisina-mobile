import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ViewProps,
} from "react-native";

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  avoidKeyboard?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = false,
  padded = true,
  avoidKeyboard = false,
  ...props
}: ScreenWrapperProps) {
  const content = (
    <View
      // 🌟 Added dark:bg-[#0B120B]
      className={`flex-1 bg-[#FAFEEF] dark:bg-[#0B120B] ${padded ? "px-6 pt-6 pb-8" : ""}`}
      {...props}
    >
      {children}
    </View>
  );

  const scrollable = scroll ? (
    <ScrollView
      // 🌟 Added dark:bg-[#0B120B]
      className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : content;

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        // 🌟 Added dark:bg-[#0B120B]
        className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable}
      </KeyboardAvoidingView>
    );
  }

  return scrollable;
}