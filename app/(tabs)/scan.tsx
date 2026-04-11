import * as ImageManipulator from "expo-image-manipulator";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useTFLite } from "../../src/hooks/useTFLite";

// 📦 REQUIRED FOR JPEG DECODING
import { Buffer } from "buffer";
import * as jpeg from "jpeg-js";

export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const { model, labels } = useTFLite();

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
  } | null>(null);

  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <Text className="text-center mb-4 text-gray-800">
          We need camera access to scan plants.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-green-600 p-3 rounded-lg shadow-md"
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!camera.current || !model) return;

    try {
      setIsProcessing(true);
      setResult(null);

      // 1. Capture Photo
      const photo = await camera.current.takePhoto({
        flash: "off",
      });

      // 2. Resize AND convert to Base64
      const manipulated = await ImageManipulator.manipulateAsync(
        `file://${photo.path}`,
        [{ resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (!manipulated.base64) throw new Error("Image conversion failed");

      // 3. Decode the Base64 string into raw RGB pixels using jpeg-js
      const imgBuffer = Buffer.from(manipulated.base64, "base64");
      const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });

      // 4. Translate pixels into the Float32 format the AI trained on (-1.0 to 1.0)
      const floatData = new Float32Array(224 * 224 * 3);
      let inputIndex = 0;
      for (let i = 0; i < rawImageData.data.length; i += 4) {
        floatData[inputIndex++] = rawImageData.data[i] / 127.5 - 1.0; // R
        floatData[inputIndex++] = rawImageData.data[i + 1] / 127.5 - 1.0; // G
        floatData[inputIndex++] = rawImageData.data[i + 2] / 127.5 - 1.0; // B
      }

      // 5. Run Inference (Pass the translated Float32 array)
      const output = model.runSync([floatData]);

      // 6. Process Results
      const probabilities = output[0] as Float32Array;

      let maxConfidence = 0;
      let maxIndex = 0;

      // Find the highest score
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxConfidence) {
          maxConfidence = probabilities[i];
          maxIndex = i;
        }
      }

      // 7. Update UI
      setResult({
        label: labels[maxIndex] || "Unknown",
        confidence: maxConfidence * 100,
      });
    } catch (error) {
      console.error("Inference Error:", error);
      Alert.alert("Error", "Failed to analyze plant. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera Preview */}
      <Camera
        ref={camera}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Target Reticle (Helps user aim) */}
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View className="w-64 h-64 border-2 border-green-400 rounded-2xl bg-transparent opacity-60" />
      </View>

      {/* UI Overlay */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
        {result && (
          <View className="bg-white p-4 rounded-2xl mb-6 w-4/5 shadow-lg items-center">
            <Text className="text-green-800 text-xs font-bold uppercase tracking-widest mb-1">
              Result Found
            </Text>
            <Text className="text-3xl font-extrabold text-gray-900 capitalize">
              {result.label}
            </Text>
            <View
              className={`mt-2 px-3 py-1 rounded-full ${result.confidence > 50 ? "bg-green-100" : "bg-red-100"}`}
            >
              <Text
                className={`font-bold ${result.confidence > 50 ? "text-green-700" : "text-red-700"}`}
              >
                Confidence: {result.confidence.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleCapture}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center shadow-lg active:scale-95 ${
            isProcessing ? "bg-gray-500" : "bg-green-600"
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <View className="w-16 h-16 rounded-full border-2 border-white/50" />
          )}
        </TouchableOpacity>

        <Text className="text-white mt-4 font-medium tracking-wide shadow-black drop-shadow-md bg-black/40 px-4 py-1 rounded-full">
          {isProcessing ? "Analyzing Leaf..." : "Tap to Scan Leaf"}
        </Text>
      </View>
    </View>
  );
}
