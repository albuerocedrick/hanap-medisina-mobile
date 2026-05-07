import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut, FadeInUp, ZoomIn, ZoomOut } from "react-native-reanimated"; 
import { selectFeaturedPlants, selectIsLoadingFeed, useFeedStore } from "../../store/useFeedStore";
import { SkeletonPlantCard } from "./HomeSkeletons";

const SKELETON_COUNT = 3;

const CARD_WIDTH = 200; 
const CARD_HEIGHT = 280;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

const HD_PLANT_IMAGES =[
  "https://images.pexels.com/photos/17497508/pexels-photo-17497508.jpeg",
  "https://images.pexels.com/photos/14878943/pexels-photo-14878943.jpeg",
  "https://images.pexels.com/photos/6223420/pexels-photo-6223420.jpeg",
  "https://images.unsplash.com/photo-1416879598555-2200dc83c18b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512428813834-c702c7702b78?q=80&w=1000&auto=format&fit=crop",
];

interface PlantCardProps {
  id: string;
  name: string;
  scientificName: string;
  hdImageUrl: string;
  onPressCard: () => void;
  onPressImage: (url: string) => void;
}

function FeaturedPlantCard({ name, scientificName, hdImageUrl, onPressCard, onPressImage }: PlantCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressCard} 
      className="rounded-[28px] overflow-hidden"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        shadowColor: "#1a3315", // Plant cards inside themselves are dark, shadow handles itself mostly
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 6,
        backgroundColor: "#1a3315"
      }}
    >
      <Image
        source={{ uri: hdImageUrl }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['transparent', 'rgba(10, 25, 10, 0.5)', 'rgba(10, 25, 10, 0.95)']}
        locations={[0.2, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View className="absolute top-4 left-4 right-4 flex-row justify-end items-start">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPressImage(hdImageUrl)}
          className="w-8 h-8 rounded-full bg-black/30 items-center justify-center border border-white/20"
        >
          <Feather name="maximize-2" size={13} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-0 left-0 right-0 p-5">
        <Text className="text-white font-bold text-[18px] leading-tight mb-0.5 tracking-[0.2px]" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-[#A2CFA3] text-[12px] font-semibold mb-4 italic tracking-[0.2px]" numberOfLines={1}>
          {scientificName}
        </Text>

        <View className="flex-row items-center justify-between border-t border-white/20 pt-3">
          <View className="flex-row items-center gap-2">
            <Feather name="book-open" size={12} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 text-[11px] font-medium tracking-[0.6px] uppercase">
              Read Guide
            </Text>
          </View>
          <View className="w-6 h-6 rounded-full bg-white/10 items-center justify-center">
            <Feather name="arrow-right" size={12} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function FeaturedPlants() {
  const featuredPlants = useFeedStore(selectFeaturedPlants);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (featuredPlants.length === 0 && isLoadingFeed) {
    return (
      <View className="mb-8">
        <View className="px-6 flex-row justify-between items-end mb-4">
          <Text
            className="text-[#22451C] dark:text-[#EAF3D5]"
            style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
          >
            Featured
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonPlantCard key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (featuredPlants.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="px-6 flex-row justify-between items-center mb-4">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Featured
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/library")} activeOpacity={0.7}>
          <Text
            className="text-[#4D8035] dark:text-[#A2CFA3]"
            style={{ fontSize: 15, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.2 }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {featuredPlants.map((item, index) => (
          <View key={item.id} style={{ marginRight: index === featuredPlants.length - 1 ? 0 : SPACING }}>
            <FeaturedPlantCard
              id={item.id}
              name={item.name}
              scientificName={item.scientificName}
              hdImageUrl={HD_PLANT_IMAGES[index % HD_PLANT_IMAGES.length]}
              onPressCard={() => router.push(`/(tabs)/library/${item.id}`)}
              onPressImage={(url) => setSelectedImage(url)} 
            />
          </View>
        ))}
      </ScrollView>

      {/* FULL SCREEN HD IMAGE MODAL */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="none"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            className="absolute top-16 right-6 w-12 h-12 rounded-full bg-white/10 items-center justify-center z-50 border border-white/20"
            onPress={() => setSelectedImage(null)}
            activeOpacity={0.7}
          >
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>

          {selectedImage && (
            <Animated.Image
              entering={ZoomIn.duration(420).springify().damping(22)}
              exiting={ZoomOut.duration(180)}
              source={{ uri: selectedImage }}
              className="w-[90%] h-[65%] rounded-[36px]"
              resizeMode="cover"
            />
          )}

          <Animated.View
            entering={FadeInUp.duration(240).delay(120)}
            exiting={FadeOut.duration(120)}
            className="absolute bottom-16 items-center"
          >
            <Text className="text-white/60 font-medium text-[14px] tracking-wide">
              High Resolution Preview
            </Text>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}