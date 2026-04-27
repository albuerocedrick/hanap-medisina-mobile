# HanapMedisina Hardware Requirements

Based on the architecture of **HanapMedisina** and the specific technologies you are using (React Native, Vision Camera, on-device TensorFlow Lite), here are the recommended minimum and optimal hardware requirements for mobile devices running your app.

## Minimum Requirements

This is the baseline required to run the app without crashing, though running the live camera and TFLite model might cause the device to heat up slightly or drop frames.

*   **Operating System:** Android 8.0 (Oreo) or iOS 13.0
*   **Processor:** Quad-core 1.8 GHz (e.g., Snapdragon 450 or equivalent)
*   **RAM:** 3 GB 
*   **Camera:** 8 Megapixel rear camera with autofocus (crucial for getting clear images of plant leaves for the model to analyze).
*   **Storage:** At least 150 MB of free space (to store the React Native bundle, the embedded TFLite model file, and local AsyncStorage/Zustand offline caches).
*   **Internet:** Required only for initial login and syncing. Can operate offline afterward.

## Recommended / Optimal Requirements

This is the hardware needed for a perfectly smooth experience—where the UI doesn't stutter while the camera is active, and the TFLite model can process frames in milliseconds.

*   **Operating System:** Android 11+ or iOS 15+
*   **Processor:** Octa-core processor with a dedicated Neural Processing Unit (NPU) or a decent GPU for hardware acceleration (e.g., Snapdragon 700/800 series, Google Tensor, or Apple A13 Bionic and newer). *TensorFlow Lite uses GPU/NPU delegation if available, making scans instantaneous.*
*   **RAM:** 4 GB to 6 GB+ 
*   **Camera:** 12+ Megapixel rear camera with fast phase-detection autofocus and good macro capabilities for close-up leaf scanning.
*   **Storage:** 500 MB+ of free space (if the user queues a lot of offline high-resolution images waiting for sync).

## Technical Justifications

1. **`react-native-vision-camera`:** This library uses native Camera2 (Android) / AVFoundation (iOS) APIs and frame processors. It is highly optimized, but pushing live 1080p frames continuously requires a capable CPU/GPU.
2. **`react-native-fast-tflite`:** Running a machine learning model on the edge (on-device) is the most resource-intensive part of your app. If a device has an NPU (Neural Engine), it will perform exponentially better. If it only has an older CPU, it might take 1-3 seconds per frame to output a confidence score.
3. **Offline Sync Queue:** When offline, saving raw image URIs and metadata takes up local storage. Devices with very low storage might fail to save offline scans safely.
