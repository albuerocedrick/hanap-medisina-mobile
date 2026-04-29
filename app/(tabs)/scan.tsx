import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Platform, Text, TouchableOpacity, View } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useTFLite } from "../../src/hooks/useTFLite";

import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as jpeg from "jpeg-js";

import apiClient from "../../src/api/client";
import { useCameraStore } from "../../src/store/useCameraStore";
import { useNetworkStore } from "../../src/store/useNetworkStore";
import { useSyncStore } from "../../src/store/useSyncStore";

// ─── Shared design tokens (Synced with the new Layout Pill) ───────────────────
const tokens = {
  green:       "#10b981",
  greenDark:   "#2E4A3D", // Matched to the deep forest green of the tab bar
  greenTint:   "rgba(16,185,129,0.10)",
  ink:         "#0f172a",
  muted:       "#64748b",
  mutedLight:  "#94A3B8",
  border:      "#E2E8F0",
  surface:     "#FFFFFF",
  bgCanvas:    "#F4F6F5", // Soft neutral for inner badges/buttons
};

// ─── Corner bracket reticle ───────────────────────────────────────────────────
const CornerMark = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const W = 24, T = 3, C = "rgba(255,255,255,0.8)";
  const isTop = pos === "tl" || pos === "tr", isLeft = pos === "tl" || pos === "bl";
  return (
    <View style={{ position: "absolute", width: W, height: W,
      top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0,
      left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0,
    }}>
      <View style={{ position: "absolute", width: W, height: T, backgroundColor: C, borderRadius: 2,
        top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0 }} />
      <View style={{ position: "absolute", width: T, height: W, backgroundColor: C, borderRadius: 2,
        left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0 }} />
    </View>
  );
};

// ─── Floating Result Card (Replaces Bottom Sheet) ─────────────────────────────
function ResultCard({ result, saveStatus, visible, onDismiss }: any) {
  // Animate from completely off-screen (bottom: -400) to its natural position
  const translateY = useRef(new Animated.Value(400)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : 400,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
        mass: 0.8,
      }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.9,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      })
    ]).start();
  }, [visible]);

  if (!result) return null;

  const isHigh  = result.confidence >= 70;
  const isMid   = result.confidence >= 40 && result.confidence < 70;
  const tierColor  = isHigh ? tokens.green  : isMid ? "#f59e0b" : "#ef4444";
  const tierBg     = isHigh ? tokens.greenTint : isMid ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  
  const syncDot  = saveStatus?.includes("cloud") ? tokens.green : saveStatus?.includes("failed") ? "#f87171" : "#fbbf24";
  const syncText = saveStatus?.includes("cloud") ? "Synced" : saveStatus?.includes("failed") ? "Queued locally" : saveStatus ? "Saved offline" : null;

  return (
    <Animated.View 
      style={{ 
        position: "absolute", 
        // Positioned safely above the ~100px floating tab bar layout
        bottom: Platform.OS === 'ios' ? 140 : 120, 
        left: 20, 
        right: 20, 
        transform: [{ translateY }, { scale }],
        // Layout pill shadow logic
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      <View 
        style={{ 
          backgroundColor: tokens.surface, 
          borderRadius: 28, // Matches the high border radius of the pill
          padding: 24,
          overflow: "hidden" 
        }}
      >
        {/* Top Header Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: tokens.mutedLight }}>
            Identified Plant
          </Text>
          <TouchableOpacity 
            onPress={onDismiss} 
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
            style={{ 
              width: 32, height: 32, borderRadius: 16, 
              backgroundColor: tokens.bgCanvas, 
              alignItems: "center", justifyContent: "center" 
            }}
          >
            <Ionicons name="close" size={18} color={tokens.muted} />
          </TouchableOpacity>
        </View>

        {/* Plant Name */}
        <Text 
          style={{ fontSize: 32, fontWeight: "800", color: tokens.greenDark, letterSpacing: -0.8, textTransform: "capitalize", marginBottom: 20 }} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {result.label}
        </Text>

        {/* Metadata Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: tierBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tierColor }} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: tierColor }}>
              {result.confidence.toFixed(1)}% match
            </Text>
          </View>
          
          {syncText && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: syncDot }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: tokens.mutedLight }}>{syncText}</Text>
            </View>
          )}
        </View>

        {/* Subtle Progress Bar */}
        <View style={{ height: 4, backgroundColor: tokens.bgCanvas, borderRadius: 99, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${Math.min(result.confidence, 100)}%`, backgroundColor: tierColor, borderRadius: 99 }} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Permission gate ──────────────────────────────────────────────────────────
function PermissionGate({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: tokens.bgCanvas, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: tokens.greenDark, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Ionicons name="camera" size={32} color={tokens.surface} />
      </View>
      <Text style={{ color: tokens.greenDark, fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 10, letterSpacing: -0.4 }}>Camera Access</Text>
      <Text style={{ color: tokens.muted, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>We need access to your camera to identify plants in real time.</Text>
      <TouchableOpacity 
        onPress={onRequest} 
        activeOpacity={0.8} 
        style={{ 
          backgroundColor: tokens.green, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, 
          shadowColor: tokens.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 }}>Enable Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device  = useCameraDevice("back");
  const camera  = useRef<Camera>(null);
  const { model, labels } = useTFLite();

  const { captureTrigger, setIsProcessing } = useCameraStore();

  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const isOnline    = useNetworkStore((s) => s.isOnline);
  const enqueueScan = useSyncStore((s) => s.enqueueScan);

  useEffect(() => { if (result) setSheetVisible(true); }, [result]);

  const handleDismiss = () => {
    setSheetVisible(false);
    setTimeout(() => setResult(null), 300); // Wait for exit animation
  };

  // ── Listen for Tab Bar captures ───────────────────────────────────────────
  useEffect(() => {
    if (captureTrigger > 0) {
      handleCapture();
    }
  }, [captureTrigger]);

  const handleCapture = async () => {
    if (!camera.current || !model) return;
    try {
      setIsProcessing(true);
      setSheetVisible(false);
      setResult(null);

      const photo = await camera.current.takePhoto({ flash: "off" });
      const manipulated = await ImageManipulator.manipulateAsync(
        `file://${photo.path}`,
        [{ resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!manipulated.base64) throw new Error("Image conversion failed");

      const imgBuffer    = Buffer.from(manipulated.base64, "base64");
      const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });
      const floatData    = new Float32Array(224 * 224 * 3);
      let idx = 0;
      for (let i = 0; i < rawImageData.data.length; i += 4) {
        floatData[idx++] = rawImageData.data[i]     / 127.5 - 1.0;
        floatData[idx++] = rawImageData.data[i + 1] / 127.5 - 1.0;
        floatData[idx++] = rawImageData.data[i + 2] / 127.5 - 1.0;
      }

      const output = model.runSync([floatData]);
      const probabilities = output[0] as Float32Array;
      let maxConf = 0, maxIdx = 0;
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxConf) { maxConf = probabilities[i]; maxIdx = i; }
      }

      const identifiedLabel  = labels[maxIdx] || "Unknown";
      const confidencePercent = maxConf * 100;
      setResult({ label: identifiedLabel, confidence: confidencePercent });

      const offlineDir = new FileSystem.Directory(FileSystem.Paths.document, "offline-scans");
      if (!offlineDir.exists) offlineDir.create();
      const permanentFile = new FileSystem.File(offlineDir, `scan_${Date.now()}.jpg`);
      new FileSystem.File(`file://${photo.path}`).copy(permanentFile);

      if (isOnline) {
        try {
          const formData = new FormData();
          formData.append("images", { uri: permanentFile.uri, name: `scan_${Date.now()}.jpg`, type: "image/jpeg" } as any);
          formData.append("scans", JSON.stringify([{
            localId: `scan_${Date.now()}`, plantName: identifiedLabel,
            confidence: confidencePercent, details: "", scannedAt: new Date().toISOString(),
          }]));
          await apiClient.post("/api/scans/sync", formData, { headers: { "Content-Type": "multipart/form-data" } });
          try { if (permanentFile.exists) permanentFile.delete(); } catch {}
          setSaveStatus("Saved to cloud");
        } catch {
          enqueueScan(permanentFile.uri, identifiedLabel, confidencePercent);
          setSaveStatus("Upload failed — saved offline");
        }
      } else {
        enqueueScan(permanentFile.uri, identifiedLabel, confidencePercent);
        setSaveStatus("Saved offline — will sync later");
      }

      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error("Inference Error:", err);
      Alert.alert("Error", "Failed to analyze plant. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasPermission) return <PermissionGate onRequest={requestPermission} />;
  if (!device) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
      <ActivityIndicator size="large" color={tokens.green} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera feed */}
      <Camera
        ref={camera}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* ── Network badge ───────────────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute", top: Platform.OS === 'ios' ? 60 : 40, right: 20,
          flexDirection: "row", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: 999, gap: 8,
        }}
        pointerEvents="none"
      >
        <View style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: isOnline ? tokens.green : tokens.mutedLight,
        }} />
        <Text style={{ color: tokens.surface, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>
          {isOnline ? "Online" : "Offline"}
        </Text>
      </View>

      {/* ── Reticle ─────────────────────────────────────────────────────────── */}
      <View
        style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", top: -80 }} // Offset slightly to account for the card
        pointerEvents="none"
      >
        <View style={{ width: 220, height: 220, position: "relative" }}>
          {(["tl","tr","bl","br"] as const).map((p) => <CornerMark key={p} pos={p} />)}
        </View>
      </View>

      {/* ── Result Floating Card ───────────────────────────────────────────── */}
      <ResultCard
        result={result}
        saveStatus={saveStatus}
        visible={sheetVisible}
        onDismiss={handleDismiss}
      />
    </View>
  );
}