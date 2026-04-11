import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";

export const useTFLite = () => {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function setupModel() {
      try {
        const loadedModel = await loadTensorflowModel(
          require("../../assets/model/plant_model.tflite"),
        );
        setModel(loadedModel);

        const [{ localUri }] = await Asset.loadAsync(
          require("../../assets/model/labels.txt"),
        );

        if (!localUri) throw new Error("Failed to load labels local URI");

        const text = await FileSystem.readAsStringAsync(localUri);
        setLabels(
          text
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l !== ""),
        );

        console.log("🎯 MODEL READY");
        setLoading(false);
      } catch (e) {
        console.error("❌ Model Loading Error:", e);
        setLoading(false);
      }
    }
    setupModel();
  }, []);

  return { model, labels, loading };
};
