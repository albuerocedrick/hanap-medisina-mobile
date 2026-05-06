import { sendEmailVerification } from "firebase/auth";
import React, { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../src/services/firebase";
import { useAuthStore } from "../../src/store/useAuthStore";
import Herbi from "../../src/components/Herbi";
import { Button } from "../../src/components/ui/Button";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.31;
const BACKGROUND_IMAGE = require("../../assets/images/login-bg3.jpg");

export default function VerifyEmailScreen() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleCheckVerification = async () => {
    setStatusMessage("");
    setIsChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setUser({ ...auth.currentUser });
      } else {
        setStatusMessage(
          "Your email isn't verified yet. Please check your inbox or spam folder.",
        );
      }
    } catch (error: any) {
      setStatusMessage("Failed to connect to the server. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setStatusMessage("");
    setIsResending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatusMessage("A new verification email has been sent!");
      }
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        setStatusMessage(
          "We just sent one! Please wait a few minutes before trying again.",
        );
      } else {
        setStatusMessage("Failed to resend email. Please try again later.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    await logout();
    router.replace("/(auth)/login");
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

        <View
          className="flex-1 px-7 pt-6 pb-6 relative"
          style={{
            backgroundColor: "#FAFEEF",
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            minHeight: height - (HEADER_HEIGHT - 40),
          }}
        >
          {/* 🌿 Herbi */}
          <View style={{ position: "absolute", top: -135, right: 30, zIndex: 99 }}>
            <Herbi />
          </View>

          {/* Title */}
          <View className="mb-6 mt-2 pr-28">
            <Text className="text-[32px] font-extrabold text-[#22451C] tracking-tight">
              Verify Email
            </Text>
            <Text className="text-[15px] text-[#4D8035] font-medium mt-1">
              One last step to get started.
            </Text>
          </View>

          {/* Email info box */}
          <View
            className="rounded-2xl p-4 mb-5"
            style={{ backgroundColor: "#EAF3D5" }}
          >
            <Text className="text-[13px] text-[#22451C] text-center leading-5">
              We sent a verification link to{"\n"}
              <Text className="font-bold text-[#4D8035]">{user?.email}</Text>
            </Text>
            <Text className="text-[13px] text-[#4D8035] text-center mt-1 leading-5">
              Click the link in your email to activate your HanapDamo account.
            </Text>
          </View>

          {/* Status Message */}
          {statusMessage ? (
            <View
              className="rounded-2xl p-4 mb-5 border"
              style={{ backgroundColor: "#EAF3D5", borderColor: "#A2CFA3" }}
            >
              <Text
                className="text-[13px] font-medium leading-5 text-center"
                style={{ color: "#22451C" }}
              >
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {/* Primary Button */}
          <Button
            title="I've verified my email"
            onPress={handleCheckVerification}
            isLoading={isChecking}
            variant="primary"
          />

          {/* Divider */}
          <View className="flex-row items-center my-4 px-2">
            <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
            <Text className="mx-4 text-[12px] text-[#4D8035] font-medium">OR</Text>
            <View className="flex-1 h-[1px] bg-[#A2CFA3]" />
          </View>

          {/* Resend Button */}
          <Button
            title="Resend verification email"
            onPress={handleResendEmail}
            disabled={isResending}
            isLoading={isResending}
            variant="outline"
          />

          {/* Cancel */}
          <TouchableOpacity
            onPress={handleCancel}
            className="mt-auto pt-6 pb-2 items-center"
          >
            <Text className="text-[#B03A3A] font-semibold text-[14px]">
              Cancel & Return to Login
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}