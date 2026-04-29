import { create } from "zustand";

interface CameraStore {
  captureTrigger: number;
  triggerCapture: () => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  captureTrigger: 0,
  triggerCapture: () => set((state) => ({ captureTrigger: state.captureTrigger + 1 })),
  isProcessing: false,
  setIsProcessing: (val) => set({ isProcessing: val }),
}));