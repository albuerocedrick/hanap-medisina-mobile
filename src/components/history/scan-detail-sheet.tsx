import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getScanById, parseDateToMs, ScanHistoryItem } from "@/src/services/firebaseHistory";
import { getAllPlants, PlantSummary } from "@/src/services/firebaseLibrary";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSyncStore } from "@/src/store/useSyncStore";

interface Props {
  visible: boolean;
  scanId: string | null;
  onClose: () => void;
}

export function ScanDetailSheet({ visible, scanId, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { syncQueue } = useSyncStore();

  const [scan, setScan] = useState<ScanHistoryItem | null>(null);
  const [libraryMatch, setLibraryMatch] = useState<PlantSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeScanId = scanId;
    if (!visible || !activeScanId) {
      // Reset state when closed
      setScan(null);
      setLibraryMatch(null);
      return;
    }

    async function loadScanData(uid: string, sid: string) {
      setLoading(true);
      setError(null);

      try {
        let currentScan: ScanHistoryItem | null = null;

        // 1. Check Offline Queue First
        const localMatch = syncQueue.find((item) => item.localId === sid);
        if (localMatch) {
          currentScan = {
            id: localMatch.localId,
            plantName: localMatch.plantName || "Unknown Plant",
            confidence: localMatch.confidence || 0,
            imageUri: localMatch.imageUri,
            createdAt: parseDateToMs(localMatch.scannedAt) || Date.now(),
            status: "pending",
          };
        } 
        // 2. Fallback to Firestore
        else {
          currentScan = await getScanById(uid, sid);
        }

        if (!currentScan) throw new Error("Scan data could not be found.");

        setScan(currentScan);

        // 3. Cross-reference Library
        const allPlants = await getAllPlants();
        const matchedPlant = allPlants.find(
          (p) => p.name.toLowerCase() === currentScan!.plantName.toLowerCase()
        );
        
        if (matchedPlant) setLibraryMatch(matchedPlant);

      } catch (err: any) {
        setError(err.message || "Failed to load scan details.");
      } finally {
        setLoading(false);
      }
    }

    if (user?.uid) {
      loadScanData(user.uid, activeScanId);
    }
  }, [scanId, visible, user?.uid, syncQueue]);

  const formatDate = (ms: number) => {
    if (!ms) return "Unknown Date";
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ms));
  };

  const confPct = scan ? (scan.confidence <= 1 ? scan.confidence * 100 : scan.confidence) : 0;
  const displayConf = Number(confPct.toFixed(2));
  
  const getConfColor = (val: number) => {
    if (val >= 80) return { bg: "#22c55e", text: "text-green-700", bar: "bg-green-50" };
    if (val >= 50) return { bg: "#f59e0b", text: "text-amber-700", bar: "bg-amber-50" };
    return { bg: "#ef4444", text: "text-red-700", bar: "bg-red-50" };
  };
  const confStyles = getConfColor(displayConf);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Dimmed Backdrop (Closes on press) */}
      <Pressable 
        style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)" }} 
        onPress={onClose} 
      />

      {/* Bottom Sheet Container */}
      <View 
        style={{ height: "70%", paddingBottom: insets.bottom }}
        className="bg-[#f8fafc] rounded-t-[32px] absolute bottom-0 left-0 right-0 shadow-xl overflow-hidden"
      >
        {/* Drag Handle */}
        <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-4 mb-2" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text className="text-sm font-bold text-slate-500 tracking-widest uppercase">
            Scan Details
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-slate-100"
          >
            <Feather name="x" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center pb-20">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : error || !scan ? (
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <Feather name="alert-triangle" size={40} color="#94a3b8" />
            <Text className="text-slate-900 text-lg font-bold mt-4 text-center">Scan Not Found</Text>
            <Text className="text-slate-500 text-center mt-2">{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* Title & Badge */}
            <View className="px-6 pt-2 pb-6">
              <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {scan.plantName}
              </Text>
              <View className="flex-row items-center mt-2">
                {scan.status === "pending" ? (
                  <View className="flex-row items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <Text className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Offline Scan</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <Feather name="check" size={12} color="#15803d" />
                    <Text className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Synced to Cloud</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Side-by-Side Images */}
            <View className="px-6 mb-6 flex-row justify-between gap-3">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Your Scan
                </Text>
                <View className="aspect-square bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                  <Image source={{ uri: scan.imageUri }} className="w-full h-full" resizeMode="cover" />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Reference
                </Text>
                <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 items-center justify-center">
                  {libraryMatch?.imageUrl ? (
                    <Image source={{ uri: libraryMatch.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="leaf-outline" size={28} color="#94a3b8" />
                  )}
                </View>
              </View>
            </View>

            {/* Details Card */}
            <View className="px-6 mb-6">
              <View className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <View className="mb-4">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text className="text-xs font-semibold text-slate-600">AI Confidence</Text>
                    <Text className={`text-base font-bold ${confStyles.text}`}>{displayConf}%</Text>
                  </View>
                  <View className={`h-2 rounded-full ${confStyles.bar} overflow-hidden`}>
                    <View className="h-full rounded-full" style={{ width: `${displayConf}%`, backgroundColor: confStyles.bg }} />
                  </View>
                </View>

                <View className="h-px bg-slate-100 mb-3" />

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="camera" size={14} color="#64748b" />
                      <Text className="text-xs font-medium text-slate-600">Captured on</Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-900">{formatDate(scan.createdAt)}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="cloud" size={14} color="#64748b" />
                      <Text className="text-xs font-medium text-slate-600">Cloud Sync</Text>
                    </View>
                    <Text className={`text-xs font-semibold ${scan.status === 'pending' ? 'text-amber-600' : 'text-slate-900'}`}>
                      {scan.status === 'pending' ? 'Pending' : formatDate(scan.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="px-6">
              {libraryMatch ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose(); // Hide sheet first
                    router.push(`/(tabs)/library/${libraryMatch.id}`); // Then navigate
                  }}
                  className="w-full bg-[#16a34a] flex-row items-center justify-center gap-2 py-3.5 rounded-xl shadow-sm"
                >
                  <Ionicons name="book-outline" size={18} color="white" />
                  <Text className="text-white text-sm font-bold tracking-wide">
                    View Full Plant Info
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-row gap-3 items-center">
                  <Feather name="info" size={16} color="#64748b" />
                  <Text className="flex-1 text-xs text-slate-600">
                    Not documented in the Library yet.
                  </Text>
                </View>
              )}
            </View>

          </ScrollView>
        )}
      </View>
    </Modal>
  );
}