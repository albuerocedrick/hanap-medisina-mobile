import { Link, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useAuthStore } from "../../src/store/useAuthStore";
import * as Haptics from "expo-haptics";
import { User, Lock, Mail } from "lucide-react-native";

import Herbi from "../../src/components/Herbi"; // ✅ added

import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.31;

const BACKGROUND_IMAGE = require("../../assets/images/login-bg3.jpg");
// ✅ removed AVATAR_IMAGE

export default function RegisterScreen() {
  const router = useRouter();
  const { registerWithEmail, loginWithGoogle, isLoading } = useAuthStore();

  const[firstName, setFirstName] = useState("");
  const[lastName, setLastName] = useState("");
  const[email, setEmail] = useState("");
  const[password, setPassword] = useState("");
  const[confirmPassword, setConfirmPassword] = useState("");
  const[errorMessage, setErrorMessage] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMessage("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setErrorMessage("All fields are required.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setErrorMessage("Please enter a valid email address.");
    }

    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setErrorMessage("Password must be at least 6 characters long.");
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setErrorMessage("Passwords do not match.");
    }

    try {
      await registerWithEmail(firstName, lastName, email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Invalid email format.");
      } else if (error.code === "auth/network-request-failed") {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage(
          error.message || "Something went wrong. Please try again.",
        );
      }
    }
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loginWithGoogle();
  };

  const headerScale = scrollY.interpolate({
    inputRange:[-100, 0],
    outputRange: [1.3, 1],
    extrapolateLeft: "extend",
    extrapolateRight: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange:[0, -(HEADER_HEIGHT * 0.4)],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 bg-[#EAF3D5]">
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          width: width,
          height: HEADER_HEIGHT + 40,
          transform:[{ scale: headerScale }, { translateY: headerTranslateY }],
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={{ height: HEADER_HEIGHT - 40 }} />

          <View 
            className="flex-1 px-7 pt-6 pb-6 relative"
            style={{ 
              backgroundColor: "#FAFEEF", 
              borderTopLeftRadius: 40, 
              borderTopRightRadius: 40,
              minHeight: height - (HEADER_HEIGHT - 40) 
            }}
          >
            {/* 🌿 Herbi Mascot */}
            <View
              style={{
                position: "absolute",
                top: -135,  // ✅ matches login
                right: 30,  // ✅ matches login
                zIndex: 99,
              }}
            >
              <Herbi />
            </View>

            <View className="mb-5 mt-2 pr-28">
              <Text className="text-[32px] font-extrabold text-[#22451C] tracking-tight">
                Create Account
              </Text>
              <Text className="text-[15px] text-[#4D8035] font-medium mt-1">
                Join HanapDamo today.
              </Text>
            </View>

            {errorMessage ? (
              <Text className="text-red-500 text-sm font-medium mb-4 text-center">
                {errorMessage}
              </Text>
            ) : null}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  icon={User}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                />
              </View>
              <View className="flex-1">
                <Input
                  icon={User}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                />
              </View>
            </View>

            <Input
              icon={Mail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <Input
              icon={Lock}
              placeholder="Password (Min. 6)"
              isPassword
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            <Input
              icon={Lock}
              placeholder="Confirm Password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
            />

            <View className="pt-2">
              <Button 
                title="Sign Up" 
                onPress={handleRegister} 
                isLoading={isLoading} 
                variant="primary" 
              />
            </View>

            <View className="flex-row items-center my-4 px-2">
              <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
              <Text className="mx-4 text-[12px] text-[#4D8035] font-medium">OR</Text>
              <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
            </View>

            <Button 
              title="Continue with Google" 
              onPress={handleGoogleLogin} 
              disabled={isLoading} 
              variant="outline" 
            />

            <View className="flex-row justify-center mt-auto pb-2 pt-4">
              <Text className="text-[#22451C] text-[14px] font-medium">
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
               <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); router.back();}}>
                <Text className="text-[#70A656] text-[14px] font-bold ml-1.5">
                  Log In
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