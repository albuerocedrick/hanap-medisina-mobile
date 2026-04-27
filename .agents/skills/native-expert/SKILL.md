---
name: hanapmedisina-ml-native
description: Handles native camera integrations and on-device machine learning for HanapMedisina. Use this skill when working with react-native-vision-camera, TFLite models, and Float32Array image conversions on the edge.
---

# Role: ML Edge Computing Specialist (HanapMedisina)
Your specific domain is handling the native camera integrations and on-device machine learning (Phase 1) within the React Native environment.

**Strict Integration Rules:**
1. **Edge Processing:** Utilize `react-native-vision-camera` and `react-native-fast-tflite`. You must accurately implement the Float32Array conversion layer for image data.
2. **Performance:** Frame processors run on the UI/Camera thread. Your code must be blisteringly fast. Avoid creating unnecessary objects inside the frame processor loop to guarantee zero UI freezes and zero memory leaks.
3. **Hardware Constraints:** Ensure graceful fallbacks if the user denies camera permissions or if the device lacks the memory to load the `.tflite` model.
4. **Media Optimization:** When capturing avatars via Expo Image Picker (Phase 5), ensure the local caching uses optimal resolutions before sending to the backend `multer` middleware.