import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; 
import { router } from "expo-router";
import { useColorScheme } from "nativewind"; // 🌟 Added
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { selectIsLoadingFeed, selectPlantOfTheDay, useFeedStore } from "../../store/useFeedStore";
import { SkeletonHeroCard } from "./HomeSkeletons";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const HIGH_RES_IMAGE = "https://images.pexels.com/photos/9942132/pexels-photo-9942132.jpeg";

export function PlantOfTheDay() {
  const plantOfTheDay = useFeedStore(selectPlantOfTheDay);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);

  const { colorScheme } = useColorScheme(); // 🌟 Added
  const isDark = colorScheme === "dark";

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform:[{ scale: scale.value }],
  }));

  if (plantOfTheDay === null && isLoadingFeed) {
    return (
      <View className="px-6 mb-8">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5] mb-4"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Plant of the Day
        </Text>
        <SkeletonHeroCard />
      </View>
    );
  }

  if (plantOfTheDay === null) return null;

  const handlePress = () => {
    router.push(`/(tabs)/library/${plantOfTheDay.id}`);
  };

  return (
    <View className="px-6 mb-8">
      <View className="flex-row justify-between items-end mb-4">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Plant of the Day
        </Text>
      </View>

      <AnimatedTouchable
        style={[
          animatedStyle,
          {
            shadowColor: isDark ? "#000" : "#22451C", // 🌟 Adapts shadow to theme
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 20,
            elevation: 8,
            backgroundColor: isDark ? "#162916" : "#FAFEEF", // 🌟 Adapts background to theme
          }
        ]}
        className="w-full h-[280px] rounded-[36px] overflow-hidden border border-transparent dark:border-white/10"
        onPress={handlePress}
        activeOpacity={0.9}
        onPressIn={() => (scale.value = withSpring(0.96))}
        onPressOut={() => (scale.value = withSpring(1))}
      >
        <Image
          source={{ uri: HIGH_RES_IMAGE }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        <LinearGradient
          colors={[
            'transparent', 
            'rgba(15, 35, 15, 0.6)', 
            'rgba(10, 25, 10, 0.95)'
          ]}
          locations={[0, 0.45, 1]}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 80, 
            paddingBottom: 24,
            paddingHorizontal: 24,
          }}
          className="flex flex-col justify-end"
        >
          <Text className="text-white font-bold text-[30px] leading-tight tracking-tight">
            {plantOfTheDay.name}
          </Text>
          <Text className="text-[#EAF3D5] text-[13px] font-semibold mt-1 mb-2 tracking-[0.4px] italic">
            {plantOfTheDay.scientificName}
          </Text>
          <Text className="text-white/85 text-[13px] font-medium mt-1 mb-5 leading-[19px]">
            {plantOfTheDay.subtitle}
          </Text>

          <View 
            className="flex-row items-center gap-2 rounded-full py-3 px-6 self-start"
            style={{ 
              backgroundColor: 'rgba(250, 254, 239, 1)', 
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4, 
            }}
          >
            <Text className="text-[#22451C] text-[13px] font-bold tracking-[0.2px]">Read Guide</Text>
            <Feather name="arrow-right" size={15} color="#4D8035" />
          </View>
        </LinearGradient>
      </AnimatedTouchable>
    </View>
  );
}