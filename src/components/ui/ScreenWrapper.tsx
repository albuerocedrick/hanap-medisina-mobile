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
      className={`flex-1 bg-[#FAFEEF] ${padded ? "px-6 pt-6 pb-8" : ""}`}
      {...props}
    >
      {children}
    </View>
  );

  const scrollable = scroll ? (
    <ScrollView
      className="flex-1 bg-[#FAFEEF]"
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
        className="flex-1 bg-[#FAFEEF]"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable}
      </KeyboardAvoidingView>
    );
  }

  return scrollable;
}