import { Link } from "expo-router";
import React, { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useAuthStore } from "../../src/store/useAuthStore";
import * as Haptics from "expo-haptics";
import { User, Lock } from "lucide-react-native";

// ✅ Herbi
import Herbi from "../../src/components/Herbi";

// UI Components
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.31;

const BACKGROUND_IMAGE = require("../../assets/images/login-bg3.jpg");

export default function LoginScreen() {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleEmailLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMessage("");

    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setErrorMessage("Please enter both email and password.");
    }

    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage("Incorrect email or password.");
    }
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loginWithGoogle();
  };

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolateLeft: "extend",
    extrapolateRight: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -(HEADER_HEIGHT * 0.4)],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 bg-[#EAF3D5]">
      {/* Header */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          width: width,
          height: HEADER_HEIGHT + 40,
          transform: [{ scale: headerScale }, { translateY: headerTranslateY }],
        }}
      >
        <Image
          source={BACKGROUND_IMAGE}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          resizeMode="cover"
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={{ height: HEADER_HEIGHT - 40 }} />

          {/* Card */}
          <View
            className="flex-1 px-7 pt-6 pb-6 relative"
            style={{
              backgroundColor: "#FAFEEF",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              minHeight: height - (HEADER_HEIGHT - 40),
            }}
          >
            {/* 🌿 Herbi Mascot */}
            <View
              style={{
                position: "absolute",
                top: -135,   // 👈 adjust if needed
                right: 30,  // 👈 adjust if needed
                zIndex: 99,
              }}
            >
              <Herbi />
            </View>

            {/* Header Text */}
            <View className="mb-5 mt-2 pr-28">
              <Text className="text-[32px] font-extrabold text-[#22451C] tracking-tight">
                Welcome
              </Text>
              <Text className="text-[15px] text-[#4D8035] font-medium mt-1">
                Let's get back to nature.
              </Text>
            </View>

            {/* Error */}
            {errorMessage ? (
              <Text className="text-red-500 text-sm font-medium mb-4 text-center">
                {errorMessage}
              </Text>
            ) : null}

            {/* Inputs */}
            <Input
              icon={User}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <Input
              icon={Lock}
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            {/* Remember */}
            <View className="flex-row items-center justify-between mb-5 px-2">
              <Text className="text-[14px] text-[#4D8035] font-medium">
                Remember me
              </Text>
              <Switch
                trackColor={{ false: "#A2CFA3", true: "#4D8035" }}
                thumbColor="#ffffff"
                onValueChange={() => {
                  Haptics.selectionAsync();
                  setRememberMe(!rememberMe);
                }}
                value={rememberMe}
                style={{ transform: [{ scale: 0.85 }] }}
              />
            </View>

            {/* Buttons */}
            <Button
              title="Sign In"
              onPress={handleEmailLogin}
              isLoading={isLoading}
              variant="primary"
            />

            <View className="flex-row items-center my-4 px-2">
              <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
              <Text className="mx-4 text-[12px] text-[#4D8035] font-medium">
                OR
              </Text>
              <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
            </View>

            <Button
              title="Continue with Google"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
            />

            {/* Footer */}
            <View className="flex-row justify-center mt-auto pb-2 pt-4">
              <Text className="text-[#22451C] text-[14px] font-medium">
                New here?
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
                  <Text className="text-[#70A656] text-[14px] font-bold ml-1.5">
                    Create Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}