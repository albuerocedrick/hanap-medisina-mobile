import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
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
import { useNetworkStore } from "@/src/store/useNetworkStore";
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
  const { syncQueue, resetRetryCount, runSync, isRunningSync } = useSyncStore();
  const isOnline = useNetworkStore((s) => s.isOnline);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [scan, setScan] = useState<ScanHistoryItem | null>(null);
  const [scanRetryCount, setScanRetryCount] = useState(0); // raw retryCount from queue
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
          setScanRetryCount(localMatch.retryCount); // capture for the retry button
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

  // ── Manual Retry Handler ────────────────────────────────────────────────────
  const handleRetryScan = async () => {
    if (!scan || !isOnline || isRunningSync) return;
    resetRetryCount(scan.id);  // unblacklist the scan
    await runSync();           // immediately attempt upload
  };

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
    if (val >= 80) return { bg: "#22c55e", text: isDark ? "#4ade80" : "#15803d", bar: isDark ? "rgba(34, 197, 94, 0.2)" : "#f0fdf4" };
    if (val >= 50) return { bg: "#f59e0b", text: isDark ? "#fbbf24" : "#b45309", bar: isDark ? "rgba(245, 158, 11, 0.2)" : "#fffbeb" };
    return { bg: "#ef4444", text: isDark ? "#f87171" : "#b91c1c", bar: isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2" };
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
        style={{ flex: 1, backgroundColor: "rgba(11, 18, 11, 0.6)" }} 
        onPress={onClose} 
      />

      {/* Bottom Sheet Container */}
      <View 
        style={{ 
          height: "70%", 
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? "#0B120B" : "#FAFEEF",
          borderTopWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)",
        }}
        className="rounded-t-[32px] absolute bottom-0 left-0 right-0 shadow-xl overflow-hidden"
      >
        {/* Drag Handle */}
        <View 
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)" }}
          className="w-12 h-1.5 rounded-full self-center mt-4 mb-2" 
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text 
            style={{ 
              color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)",
              fontFamily: "Quicksand_700Bold",
            }}
            className="text-sm tracking-widest uppercase"
          >
            Scan Details
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }}
            className="w-8 h-8 items-center justify-center rounded-full"
          >
            <Feather name="x" size={18} color={isDark ? "rgba(248,250,252,0.9)" : "#22451C"} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center pb-20">
            <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#16a34a"} />
          </View>
        ) : error || !scan ? (
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <Feather name="alert-triangle" size={40} color={isDark ? "rgba(248,250,252,0.3)" : "#A2CFA3"} />
            <Text style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }} className="text-lg mt-4 text-center">Scan Not Found</Text>
            <Text style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_500Medium" }} className="text-center mt-2">{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* Title & Badge */}
            <View className="px-6 pt-2 pb-6">
              <Text 
                style={{ 
                  color: isDark ? "#F8FAFC" : "#22451C",
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontWeight: "500" 
                }}
                className="text-3xl tracking-tight"
              >
                {scan.plantName}
              </Text>
              <View className="flex-row items-center mt-2">
                {scan.status === "pending" ? (
                  <View 
                    style={{
                      backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
                      borderWidth: 1,
                    }}
                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                  >
                    <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <Text 
                      style={{ color: isDark ? "#fbbf24" : "#b45309", fontFamily: "Quicksand_700Bold" }}
                      className="text-[10px] uppercase tracking-wider"
                    >
                      Offline Scan
                    </Text>
                  </View>
                ) : (
                  <View 
                    style={{
                      backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "#f0fdf4",
                      borderColor: isDark ? "rgba(22, 163, 74, 0.3)" : "#bbf7d0",
                      borderWidth: 1,
                    }}
                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                  >
                    <Feather name="check" size={12} color={isDark ? "#4ade80" : "#15803d"} />
                    <Text 
                      style={{ color: isDark ? "#4ade80" : "#15803d", fontFamily: "Quicksand_700Bold" }}
                      className="text-[10px] uppercase tracking-wider"
                    >
                      Synced to Cloud
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Side-by-Side Images */}
            <View className="px-6 mb-6 flex-row justify-between gap-3">
              <View className="flex-1">
                <Text 
                  style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Your Scan
                </Text>
                <View 
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)", borderWidth: 1 }}
                  className="aspect-square bg-slate-200 rounded-2xl overflow-hidden"
                >
                  <Image source={{ uri: scan.imageUri }} className="w-full h-full" resizeMode="cover" />
                </View>
              </View>

              <View className="flex-1">
                <Text 
                  style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_700Bold" }}
                  className="text-[11px] uppercase tracking-wider mb-2"
                >
                  Reference
                </Text>
                <View 
                  style={{ 
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.5)", 
                    borderWidth: 1,
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)"
                  }}
                  className="aspect-square rounded-2xl overflow-hidden items-center justify-center"
                >
                  {libraryMatch?.imageUrl ? (
                    <Image source={{ uri: libraryMatch.imageUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Ionicons name="leaf-outline" size={28} color={isDark ? "rgba(248,250,252,0.3)" : "#A2CFA3"} />
                  )}
                </View>
              </View>
            </View>

            {/* Details Card */}
            <View className="px-6 mb-6">
              <View 
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.55)",
                  borderWidth: 1,
                }}
                className="rounded-2xl p-4 shadow-sm"
              >
                <View className="mb-4">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text 
                      style={{ color: isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.8)", fontFamily: "Quicksand_600SemiBold" }}
                      className="text-xs"
                    >
                      AI Confidence
                    </Text>
                    <Text style={{ color: confStyles.text, fontFamily: "Quicksand_700Bold" }} className="text-base">{displayConf}%</Text>
                  </View>
                  <View style={{ backgroundColor: confStyles.bar }} className="h-2 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${displayConf}%`, backgroundColor: confStyles.bg }} />
                  </View>
                </View>

                <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }} className="h-px mb-3" />

                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="camera" size={14} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                      <Text style={{ color: isDark ? "rgba(248,250,252,0.6)" : "#4D8035", fontFamily: "Quicksand_500Medium" }} className="text-xs">Captured on</Text>
                    </View>
                    <Text style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_600SemiBold" }} className="text-xs">{formatDate(scan.createdAt)}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="cloud" size={14} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                      <Text style={{ color: isDark ? "rgba(248,250,252,0.6)" : "#4D8035", fontFamily: "Quicksand_500Medium" }} className="text-xs">Cloud Sync</Text>
                    </View>
                    <Text 
                      style={{ 
                        color: scan.status === 'pending' 
                          ? (isDark ? "#f59e0b" : "#d97706") 
                          : (isDark ? "#F8FAFC" : "#22451C"), 
                        fontFamily: "Quicksand_600SemiBold" 
                      }} 
                      className="text-xs"
                    >
                      {scan.status === 'pending' ? 'Pending' : formatDate(scan.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="px-6 gap-3">
              {/* Retry Sync Button — only for blacklisted pending scans */}
              {scan?.status === "pending" && scanRetryCount >= 3 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={!isOnline || isRunningSync}
                  onPress={handleRetryScan}
                  style={{
                    backgroundColor: !isOnline 
                      ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)")
                      : "#f59e0b",
                    borderColor: !isOnline 
                      ? "transparent"
                      : "#d97706",
                    borderWidth: !isOnline ? 0 : 1,
                  }}
                  className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl shadow-sm"
                >
                  {isRunningSync ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Feather name="refresh-cw" size={16} color={!isOnline ? (isDark ? "rgba(248,250,252,0.4)" : "#4D8035") : "white"} />
                  )}
                  <Text style={{ 
                    fontFamily: "Quicksand_700Bold", 
                    color: !isOnline ? (isDark ? "rgba(248,250,252,0.5)" : "#4D8035") : "white" 
                  }} className="text-sm">
                    {!isOnline ? "No Connection to Sync" : isRunningSync ? "Syncing…" : "Retry Sync"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Library navigation or fallback */}
              {libraryMatch ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    router.push(`/(tabs)/library/${libraryMatch.id}`);
                  }}
                  style={{ backgroundColor: "#4D8035" }}
                  className="w-full flex-row items-center justify-center gap-2 py-3.5 rounded-xl shadow-sm"
                >
                  <Ionicons name="book-outline" size={18} color="white" />
                  <Text style={{ fontFamily: "Quicksand_700Bold" }} className="text-white text-sm tracking-wide">
                    View Full Plant Info
                  </Text>
                </TouchableOpacity>
              ) : (
                <View 
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(162,207,163,0.15)",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)",
                    borderWidth: 1,
                  }}
                  className="rounded-xl p-3 flex-row gap-3 items-center"
                >
                  <Feather name="info" size={16} color={isDark ? "rgba(248,250,252,0.6)" : "#4D8035"} />
                  <Text style={{ color: isDark ? "rgba(248,250,252,0.8)" : "rgba(34,69,28,0.8)", fontFamily: "Quicksand_500Medium" }} className="flex-1 text-xs">
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