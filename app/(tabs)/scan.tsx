import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useTFLite } from "../../src/hooks/useTFLite";

import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as jpeg from "jpeg-js";

import { useRouter } from "expo-router";
import apiClient from "../../src/api/client";
import { getAllPlants } from "../../src/services/firebaseLibrary";
import { useCameraStore } from "../../src/store/useCameraStore";
import { useNetworkStore } from "../../src/store/useNetworkStore";
import { useSyncStore } from "../../src/store/useSyncStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Sheet snaps: between 50% and 66% of screen height
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.62);

// Minimum confidence threshold (below this → "Unknown" rejection)
const MIN_CONFIDENCE = 35;

// ─── Design tokens (kept in sync with existing codebase) ─────────────────────
const tokens = {
  green:      "#10b981",
  greenDark:  "#2E4A3D",
  greenTint:  "rgba(16,185,129,0.10)",
  ink:        "#0f172a",
  muted:      "#64748b",
  mutedLight: "#94A3B8",
  border:     "#E2E8F0",
  surface:    "#FFFFFF",
  bgCanvas:   "#F4F6F5",
  amber:      "#f59e0b",
  amberTint:  "rgba(245,158,11,0.08)",
  red:        "#ef4444",
  redTint:    "rgba(239,68,68,0.08)",
};

// ─── Sheet state machine ──────────────────────────────────────────────────────
type SheetState = "hidden" | "loading" | "success" | "error";

// ─── Corner bracket reticle ───────────────────────────────────────────────────
const CornerMark = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const W = 24, T = 3, C = "rgba(255,255,255,0.8)";
  const isTop  = pos === "tl" || pos === "tr";
  const isLeft = pos === "tl" || pos === "bl";
  return (
    <View style={{
      position: "absolute", width: W, height: W,
      top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0,
      left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0,
    }}>
      <View style={{
        position: "absolute", width: W, height: T, backgroundColor: C, borderRadius: 2,
        top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0,
      }} />
      <View style={{
        position: "absolute", width: T, height: W, backgroundColor: C, borderRadius: 2,
        left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0,
      }} />
    </View>
  );
};

// ─── Permission gate ──────────────────────────────────────────────────────────
function PermissionGate({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionIcon}>
        <Ionicons name="camera" size={32} color={tokens.surface} />
      </View>
      <Text style={styles.permissionTitle}>Camera Access</Text>
      <Text style={styles.permissionBody}>
        We need access to your camera to identify plants in real time.
      </Text>
      <TouchableOpacity onPress={onRequest} activeOpacity={0.8} style={styles.permissionButton}>
        <Text style={styles.permissionButtonText}>Enable Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Content sub-components ───────────────────────────────────────────────────

/** Skeleton shimmer while AI is running */
function LoadingState() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={tokens.green} style={{ marginBottom: 14 }} />
      <Animated.View style={[styles.shimmerLine, styles.shimmerWide, { opacity }]} />
      <Animated.View style={[styles.shimmerLine, styles.shimmerNarrow, { opacity }]} />
      <Text style={styles.loadingHint}>Analyzing plant…</Text>
    </View>
  );
}

/** Success result content */
function SuccessState({
  label,
  confidence,
  saveStatus,
  onViewDetails,
}: {
  label: string;
  confidence: number;
  saveStatus: string | null;
  onViewDetails: () => void;
}) {
  const isHigh = confidence >= 70;
  const isMid  = confidence >= MIN_CONFIDENCE && confidence < 70;
  const tierColor = isHigh ? tokens.green : isMid ? tokens.amber : tokens.red;
  const tierBg    = isHigh ? tokens.greenTint : isMid ? tokens.amberTint : tokens.redTint;

  const syncDot  = saveStatus?.includes("cloud") ? tokens.green
                 : saveStatus?.includes("failed") ? "#f87171"
                 : "#fbbf24";
  const syncText = saveStatus?.includes("cloud")   ? "Synced to cloud"
                 : saveStatus?.includes("failed")   ? "Queued locally"
                 : saveStatus                        ? "Saved offline"
                 : null;

  return (
    <View style={styles.resultContainer}>
      {/* Label overline */}
      <Text style={styles.overline}>Identified Plant</Text>

      {/* Plant name */}
      <Text style={styles.plantName} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>

      {/* Confidence + sync row */}
      <View style={styles.metaRow}>
        <View style={[styles.confidencePill, { backgroundColor: tierBg }]}>
          <View style={[styles.dot, { backgroundColor: tierColor }]} />
          <Text style={[styles.confidenceText, { color: tierColor }]}>
            {confidence.toFixed(1)}% match
          </Text>
        </View>

        {syncText && (
          <View style={styles.syncRow}>
            <View style={[styles.dot, { backgroundColor: syncDot }]} />
            <Text style={styles.syncText}>{syncText}</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${Math.min(confidence, 100)}%` as any,
          backgroundColor: tierColor,
        }]} />
      </View>

      {/* CTA */}
      <TouchableOpacity onPress={onViewDetails} activeOpacity={0.85} style={styles.ctaButton}>
        <Text style={styles.ctaText}>View Full Details</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/** Rejection content */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.resultContainer}>
      <View style={styles.errorIconWrap}>
        <Ionicons name="leaf-outline" size={28} color={tokens.amber} />
      </View>
      <Text style={styles.errorTitle}>Plant Not Recognized</Text>
      <Text style={styles.errorBody}>
        Try taking a clearer, closer photo with good lighting. Make sure the plant
        fills most of the frame.
      </Text>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.85} style={styles.retryButton}>
        <Ionicons name="camera-outline" size={16} color={tokens.greenDark} style={{ marginRight: 6 }} />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
function ScanBottomSheet({
  sheetState,
  photoUri,
  result,
  saveStatus,
  onDismiss,
  onViewDetails,
}: {
  sheetState: SheetState;
  photoUri: string | null;
  result: { label: string; confidence: number } | null;
  saveStatus: string | null;
  onDismiss: () => void;
  onViewDetails: () => void;
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Keeps the sheet in the React tree during the exit animation so the
  // spring has something to run against. Flips to false only once the
  // animation callback fires — no private Animated internals needed.
  const [isRendered, setIsRendered] = useState(sheetState !== "hidden");

  const isVisible = sheetState !== "hidden";

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 26,
          stiffness: 280,
          mass: 0.9,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SHEET_HEIGHT,
          useNativeDriver: true,
          damping: 30,
          stiffness: 320,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [isVisible]);

  if (!isRendered) return null;

  return (
    <Modal transparent visible={true} animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={sheetState !== "loading" ? onDismiss : undefined} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_HEIGHT, transform: [{ translateY }] },
        ]}
      >
        {/* Handle pill */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Photo preview strip */}
        {photoUri && (
          <View style={styles.imageWrap}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            {/* Fade overlay at bottom of image for content readability */}
            <View style={styles.imageFade} />
          </View>
        )}

        {/* Content area — crossfade between states */}
        <View style={styles.sheetContent}>
          {sheetState === "loading" && <LoadingState />}

          {sheetState === "success" && result && (
            <SuccessState
              label={result.label}
              confidence={result.confidence}
              saveStatus={saveStatus}
              onViewDetails={onViewDetails}
            />
          )}

          {sheetState === "error" && (
            <ErrorState onRetry={onDismiss} />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const { model, labels } = useTFLite();

  const { captureTrigger, setIsProcessing } = useCameraStore();
  const isOnline    = useNetworkStore((s) => s.isOnline);
  const enqueueScan = useSyncStore((s) => s.enqueueScan);

  // Sheet state
  const [sheetState, setSheetState] = useState<SheetState>("hidden");
  const [photoUri,   setPhotoUri]   = useState<string | null>(null);
  const [result,     setResult]     = useState<{ label: string; confidence: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [flashMode,  setFlashMode]  = useState<"on" | "off" | "auto">("off");

  // Guard against double-fires
  const isCapturing = useRef(false);

  // ── Listen for Tab Bar capture trigger ─────────────────────────────────────
  useEffect(() => {
    if (captureTrigger > 0) handleCapture();
  }, [captureTrigger]);

  const handleDismiss = useCallback(() => {
    setSheetState("hidden");
    // Clean up state after exit animation finishes
    setTimeout(() => {
      setPhotoUri(null);
      setResult(null);
      setSaveStatus(null);
    }, 350);
  }, []);

  const handleViewDetails = useCallback(async () => {
    if (!result) return;
    
    setIsProcessing(true); // Re-use the existing loading overlay
    try {
      const allPlants = await getAllPlants();
      const matchedPlant = allPlants.find(
        (p) => p.name.toLowerCase() === result.label.toLowerCase()
      );

      handleDismiss();

      setTimeout(() => {
        setIsProcessing(false);
        if (matchedPlant) {
          router.push(`/(tabs)/library/${matchedPlant.id}`);
        } else {
          Alert.alert(
            "Plant Not Found",
            "This plant is not yet documented in our library database."
          );
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      handleDismiss();
      Alert.alert("Error", "Could not connect to the library database.");
    }
  }, [result, router, handleDismiss, setIsProcessing]);

  const handleCapture = async () => {
    if (!camera.current || !model || isCapturing.current) return;
    isCapturing.current = true;

    try {
      setIsProcessing(true);

      // ── 1. Take photo & open sheet immediately in loading state ────────────
      const photo = await camera.current.takePhoto({ flash: flashMode });
      const localUri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      setPhotoUri(localUri);
      setSheetState("loading");
      setResult(null);
      setSaveStatus(null);

      // ── 2. Resize & decode for TFLite ──────────────────────────────────────
      const manipulated = await ImageManipulator.manipulateAsync(
        localUri,
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

      // ── 3. Run inference ───────────────────────────────────────────────────
      const output        = model.runSync([floatData]);
      const probabilities = output[0] as Float32Array;
      let maxConf = 0, maxIdx = 0;
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxConf) { maxConf = probabilities[i]; maxIdx = i; }
      }

      const identifiedLabel   = labels[maxIdx] || "Unknown";
      const confidencePercent = maxConf * 100;

      // ── 4. Validation gate ─────────────────────────────────────────────────
      // Case-insensitive unknown check + confidence floor.
      // Any of these conditions means we cannot reliably identify the plant.
      const isUnknownLabel =
        !identifiedLabel ||
        identifiedLabel.toLowerCase() === "unknown" ||
        identifiedLabel.toLowerCase().startsWith("unknown");

      const isRejected = isUnknownLabel || confidencePercent < MIN_CONFIDENCE;

      if (isRejected) {
        // Do NOT save or queue anything — just show the error UI.
        setSheetState("error");
        return;
      }

      // ── 5. Accepted — show result, then handle storage ────────────────────
      const scanId = `scan_${Date.now()}`;
      setResult({ label: identifiedLabel, confidence: confidencePercent });

      if (isOnline) {
        // ── Online path: upload directly from the temp photo path.
        // Only write a permanent local copy if the upload fails.
        try {
          const formData = new FormData();
          formData.append("images", {
            uri:  localUri,
            name: `${scanId}.jpg`,
            type: "image/jpeg",
          } as any);
          formData.append(
            "scans",
            JSON.stringify([{
              localId:    scanId,
              plantName:  identifiedLabel,
              confidence: confidencePercent,
              details:    "",
              scannedAt:  new Date().toISOString(),
            }]),
          );
          await apiClient.post("/api/scans/sync", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            transformRequest: (data) => data,
          });
          setSaveStatus("Saved to cloud");
        } catch (error) {
          console.error("Upload failed in ScanScreen:", error);
          // Upload failed — persist locally and queue for later retry.
          const offlineDir = new FileSystem.Directory(
            FileSystem.Paths.document,
            "offline-scans",
          );
          if (!offlineDir.exists) offlineDir.create();
          const permanentFile = new FileSystem.File(offlineDir, `${scanId}.jpg`);
          new FileSystem.File(localUri).copy(permanentFile);
          enqueueScan(permanentFile.uri, identifiedLabel, confidencePercent);
          setSaveStatus("Upload failed — saved offline");
        }
      } else {
        // ── Offline path: persist locally and queue for sync when back online.
        const offlineDir = new FileSystem.Directory(
          FileSystem.Paths.document,
          "offline-scans",
        );
        if (!offlineDir.exists) offlineDir.create();
        const permanentFile = new FileSystem.File(offlineDir, `${scanId}.jpg`);
        new FileSystem.File(localUri).copy(permanentFile);
        enqueueScan(permanentFile.uri, identifiedLabel, confidencePercent);
        setSaveStatus("Saved offline — will sync later");
      }

      setSheetState("success");
      setTimeout(() => setSaveStatus(null), 3500);

    } catch (err) {
      console.error("Inference Error:", err);
      setSheetState("hidden");
      Alert.alert("Error", "Failed to analyze plant. Please try again.");
    } finally {
      setIsProcessing(false);
      isCapturing.current = false;
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!hasPermission) return <PermissionGate onRequest={requestPermission} />;
  if (!device) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={tokens.green} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera feed */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={sheetState === "hidden"}
        photo={true}
      />

      {/* Flash toggle */}
      {device.hasFlash && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.flashButton, { top: Platform.OS === "ios" ? 60 : 40 }]}
          onPress={() => setFlashMode(m => m === "off" ? "on" : m === "on" ? "auto" : "off")}
        >
          <Ionicons 
            name={flashMode === "off" ? "flash-off" : "flash"} 
            size={16} 
            color={flashMode === "on" ? tokens.amber : tokens.surface} 
          />
          <Text style={styles.flashText}>
            {flashMode === "auto" ? "AUTO" : flashMode === "on" ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Network badge */}
      <View
        style={[styles.networkBadge, { top: Platform.OS === "ios" ? 60 : 40 }]}
        pointerEvents="none"
      >
        <View style={[styles.dot, { backgroundColor: isOnline ? tokens.green : tokens.mutedLight }]} />
        <Text style={styles.networkText}>{isOnline ? "Online" : "Offline"}</Text>
      </View>

      {/* Reticle */}
      <View style={styles.reticleContainer} pointerEvents="none">
        <View style={styles.reticle}>
          {(["tl", "tr", "bl", "br"] as const).map((p) => (
            <CornerMark key={p} pos={p} />
          ))}
        </View>
      </View>

      {/* Bottom Sheet */}
      <ScanBottomSheet
        sheetState={sheetState}
        photoUri={photoUri}
        result={result}
        saveStatus={saveStatus}
        onDismiss={handleDismiss}
        onViewDetails={handleViewDetails}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const IMAGE_HEIGHT = 160;

const styles = StyleSheet.create({
  // ── Permission gate
  permissionContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: tokens.bgCanvas, paddingHorizontal: 32,
  },
  permissionIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: tokens.greenDark,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  permissionTitle: {
    color: tokens.greenDark, fontSize: 20, fontWeight: "700",
    textAlign: "center", marginBottom: 10, letterSpacing: -0.4,
  },
  permissionBody: {
    color: tokens.muted, fontSize: 15, textAlign: "center",
    lineHeight: 22, marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: tokens.green, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 999,
    shadowColor: tokens.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  permissionButtonText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },

  // ── Loading screen
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },

  // ── Network badge
  networkBadge: {
    position: "absolute", right: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, gap: 8,
  },
  networkText: { color: tokens.surface, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },

  // ── Reticle
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center", top: -80,
  },
  reticle: { width: 220, height: 220, position: "relative" },

  // ── Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 10,
  },

  // ── Bottom sheet shell
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: tokens.surface,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    zIndex: 20,
    // Subtle shadow lifting it off the camera
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 16,
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center", paddingTop: 14, paddingBottom: 4,
  },
  handle: {
    width: 40, height: 4, borderRadius: 99,
    backgroundColor: tokens.border,
  },

  // ── Image preview
  imageWrap: {
    marginHorizontal: 20,
    marginTop: 8,
    height: IMAGE_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: tokens.bgCanvas,
  },
  previewImage: {
    width: "100%", height: "100%",
  },
  imageFade: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
    // Subtle gradient-like fade using opacity on a white view
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // ── Sheet content area
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    paddingTop: 16,
  },

  // ── Loading state
  loadingContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 10,
  },
  shimmerLine: {
    height: 14, borderRadius: 8, backgroundColor: tokens.border,
  },
  shimmerWide:   { width: "60%" },
  shimmerNarrow: { width: "40%" },
  loadingHint: {
    marginTop: 4, fontSize: 13, color: tokens.mutedLight, fontWeight: "500",
  },

  // ── Result (shared)
  resultContainer: { flex: 1, justifyContent: "center" },
  overline: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.2,
    textTransform: "uppercase", color: tokens.mutedLight,
    marginBottom: 6,
  },
  plantName: {
    fontSize: 30, fontWeight: "800", color: tokens.greenDark,
    letterSpacing: -0.8, textTransform: "capitalize",
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
  },
  confidencePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  confidenceText: { fontSize: 13, fontWeight: "700" },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  syncText: { fontSize: 12, fontWeight: "600", color: tokens.mutedLight },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Progress bar
  progressTrack: {
    height: 4, backgroundColor: tokens.bgCanvas,
    borderRadius: 99, overflow: "hidden", marginBottom: 22,
  },
  progressFill: { height: "100%", borderRadius: 99 },

  // CTA button (success)
  ctaButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: tokens.green,
    paddingVertical: 15, borderRadius: 16,
    shadowColor: tokens.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10,
    elevation: 6,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },

  // Error state
  errorIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: tokens.amberTint,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, alignSelf: "center",
  },
  errorTitle: {
    fontSize: 20, fontWeight: "700", color: tokens.ink,
    textAlign: "center", letterSpacing: -0.4, marginBottom: 10,
  },
  errorBody: {
    fontSize: 14, color: tokens.muted, textAlign: "center",
    lineHeight: 21, marginBottom: 24, paddingHorizontal: 8,
  },

  // Retry button (error)
  retryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: tokens.bgCanvas,
    borderWidth: 1.5, borderColor: tokens.border,
    paddingVertical: 14, borderRadius: 16,
  },
  retryText: { color: tokens.greenDark, fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },

  // Flash button
  flashButton: {
    position: "absolute", left: 20,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, gap: 6,
  },
  flashText: { color: tokens.surface, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
});