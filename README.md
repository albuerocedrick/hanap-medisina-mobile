<div align="center">

# 🌿 HanapMedisina Mobile
**An offline-first, real-time machine learning medicinal plant leaf scanner.**

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
* **Vision Camera (v4) & Image Manipulator:** Captures high-resolution video frames on native threads and pre-processes (resizes/crops) them for the model.
* **JPEG-JS & Buffer:** Manually decodes captured images into raw RGB pixels, translating them into the exact `-1.0` to `1.0` Float32 arrays required by the AI.

### ☁️ Backend & Database (Three-Tier Architecture)
* **Express.js & Node.js:** Custom backend API handling all secure database write operations.
* **Firebase (Firestore/Auth):** Centralized cloud database and identity provider, utilizing (`@react-native-google-signin/google-signin for user access`).
* **Firebase Admin SDK & Secure Store:** Backend middleware to securely verify user ID tokens, with expo-secure-store safely managing local session data.
* **Axios:** Frontend HTTP client bridging the mobile app to the Express API.

### 💾 State & Offline Management
* **Zustand:** Global state management for tracking pending offline scans.
* **AsyncStorage & File System:** Utilizes (`@react-native-async-storage/async-storage`) for persisting favorite items/queued scans, and (`expo-file-system`) for managing local model caching when the device loses network connectivity.
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

**✅ Phase 2: Authentication & Security**
- [x] Implement Firebase Email/Password Auth on frontend.
- [x] Attach Firebase ID Tokens to Axios headers.
- [x] Build Express middleware to validate tokens before database writes.

**🚀 Phase 3: The Deep Library & Offline Favorites**
- [ ] Direct Read Feed: Connect the main Library tab directly to Firestore for high-speed, real-time list rendering, including the Search Bar and Filter Pills.
- [ ] Nested Plant Details: Build the dynamic [id].tsx screen with the three core sub-tabs: Details (scientific names, facts, warnings), Research (studies, references), and Compare (look-alikes).
- [ ] Nested Plant Details: Build the dynamic [id].tsx screen with the three core sub-tabs: Details (scientific names, facts, warnings), Research (studies, references), and Compare (look-alikes).
- [ ] Offline Favorites: Build the "Save/Favorite" system using persistent local device storage so marked plants can be accessed when the internet is restricted.

**🔄 Phase 4: Network Monitoring & Sync Engine**
- [ ] State Detection: Integrate network monitoring to dynamically switch the app's UI between Online Mode and Offline Mode.
- [ ] The Sync Queue: Build a persistent local queue (using Zustand + Local Storage) to save offline plant scans (image URIs + TFLite results).
- [ ] The Sync Prompt & Handshake: Build the UI to prompt the user upon network reconnection. Upon confirmation, fire the queued data to the Express backend -> Validate -> Upload to Cloudinary -> Write to Firestore -> Clear the local queue.

**📊 Phase 5: History, Profile & Media Polish**
- [ ] Unified History Tab: Merge locally queued scans and cloud-retrieved scans into one seamless list with filtering options. Build the detailed result analysis page for past scans.
- [ ] Profile Tab & Stats: Build the Profile UI to display dynamic user statistics (total scans, species identified, total saved items).
- [ ] Profile Media: Wire up Cloudinary to allow the user to securely update their profile picture via the Express backend.
- [ ] Final Polish: Audit all NativeWind styling and ensure offline-restricted screens show proper empty states.

**📦 Phase 6: Production & Deployment**
- [ ] Deploy Express Server to cloud hosting (Render/Railway).
- [ ] Point Axios baseURL to live production URL.
- [ ] Generate final production APK via EAS Build (`eas build -p android --profile preview`).

</details>

---
<div align="center">
  <i>Developed for HanapDamo Mobile</i>
</div>
