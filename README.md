<div align="center">

# 🌿 HanapMedisina Mobile
**An offline-first, real-time machine learning botanical scanner.**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](#)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](#)

</div>

> **System Overview:** HanapDamo utilizes an on-device TensorFlow Lite model to scan and identify medicinal plants natively with zero latency. It features a robust hybrid online-offline architecture where high-speed read operations are handled directly via Firebase, while secure write operations are routed through a custom Express.js backend.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture--tech-stack)
2. [Prerequisites](#-prerequisites)
3. [Installation & Setup](#-installation--setup)
4. [Running the App](#-running-the-app-local-development)
5. [Development Roadmap](#-development-roadmap)

---

## 🏗 System Architecture & Tech Stack

### 📱 Frontend & Core Framework
* **React Native & Expo:** Core mobile framework.
* **NativeWind (Tailwind CSS):** For rapid, utility-first UI styling.
* **Expo Router:** File-based routing and tab navigation.

### 🧠 Machine Learning & Camera Engine
* **TensorFlow Lite:** Runs the `.tflite` image classification model directly on the device.
* **Vision Camera (v4):** Captures high-resolution video frames on native threads.
* **JPEG-JS & Buffer:** Manually decodes captured images into raw RGB pixels, translating them into the exact `-1.0` to `1.0` Float32 arrays required by the AI.

### ☁️ Backend & Database (Three-Tier Architecture)
* **Express.js & Node.js:** Custom backend API handling all secure database write operations.
* **Firebase (Firestore/Auth):** Centralized cloud database and identity provider.
* **Firebase Admin SDK:** Backend middleware to securely verify user ID tokens.
* **Axios:** Frontend HTTP client bridging the mobile app to the Express API.

### 💾 State & Offline Management
* **Zustand:** Global state management for tracking pending offline scans.
* **Local Storage:** Persists "Favorited" library plants and queued scan results when the device loses network connectivity.
* **Network Monitoring:** Real-time tracking to dynamically toggle between Cloud-Read and Offline-Read modes.

---

## 🚀 Prerequisites

Before cloning this project, ensure your local development environment is prepared:

* **[Node.js](https://nodejs.org/)** (v18 or higher)
* **[Git](https://git-scm.com/)**
* **[Java Development Kit (JDK 17)](https://adoptium.net/)**
* **Android Studio** (Required for the Android SDK & C++ compilers)
* **ADB (Android Debug Bridge)** (For USB debugging and reverse proxying)
* **Physical Android Device** (Emulators cannot test the Vision Camera native modules)

---

## 🛠 Installation & Setup

**1. Clone the repository and install dependencies:**
```bash
git clone https://github.com/albuerocedrick/hanap-medisina-mobile.git
cd hanap-medisina-mobile
npm install
```

**2. Configure Local Android SDK Path:**
Because we do not upload private system paths to GitHub, you must manually point the app to your SDK. Create a file at `android/local.properties` and add:

*For Windows:*
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```
*For Mac:*
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

---

## 📱 Running the App (Local Development)

Because this app utilizes native C++ camera plugins and custom `metro.config.js` setups for local `.tflite` models, you must compile the native code and start the JS bundler separately.

**Step 1: Start the Metro Server (Terminal 1)** *The `-c` flag forces Metro to clear its cache and correctly bundle the ML models.*
```bash
npx expo start -c
```

**Step 2: Build the Native App (Terminal 2)** 
```bash
npx expo run:android
```

> **💡 Connecting to a Local Backend?**
> If your Express server is running on `localhost`, use ADB to reverse-proxy the port so your physical phone can reach it.
> ```bash
> adb reverse tcp:3000 tcp:3000
> ```

---

## 🗺 Development Roadmap

<details open>
<summary><b>Click to collapse/expand phases</b></summary>
  
<br>

**✅ Phase 0: Foundation**
- [x] Configure Firebase (Firestore/Auth) and generate `serviceAccountKey.json`.
- [x] Initialize Expo Tabs Template (Library, Scan, History, Profile).
- [x] Initialize Express Server skeleton and link to Admin SDK.
- [x] Establish Frontend-to-Backend bridge via Axios.

**✅ Phase 1: The Offline Core (Current)**
- [x] Configure Native Camera permissions and UI.
- [x] Integrate TensorFlow Lite model natively.
- [x] Build image translation layer (JPEG to Float32Array).
- [x] Output accurate confidence percentages entirely offline.

**⏳ Phase 2: Authentication & Security**
- [ ] Implement Firebase Email/Password Auth on frontend.
- [ ] Attach Firebase ID Tokens to Axios headers.
- [ ] Build Express middleware to validate tokens before database writes.

**🚀 Phase 3: The Library and Local Storage**
- [ ] Connect Library tab for high-speed direct Firestore reads.
- [ ] Build "Save for Offline" feature using local storage.
- [ ] Implement conditional rendering (Cloud Library vs. Saved Offline Library).

**🔄 Phase 4: Sync Engine (Offline & Online)**
- [ ] Integrate Network Monitoring (NetInfo).
- [ ] Build Zustand Sync Queue for pending offline scans.
- [ ] Develop "Sync Handshake" to push queued scans to Express API.

**📊 Phase 5: History & Profile**
- [ ] Merge Local Scans and Cloud Scans into a unified History Tab.
- [ ] Build Profile UI (Logout, Account Details).
- [ ] Final NativeWind UI/UX Polish.

**📦 Phase 6: Production & Deployment**
- [ ] Deploy Express Server to cloud hosting (Render/Railway).
- [ ] Point Axios baseURL to live production URL.
- [ ] Generate final production APK via EAS Build (`eas build -p android --profile preview`).

</details>

---
<div align="center">
  <i>Developed for HanapDamo Mobile</i>
</div>
