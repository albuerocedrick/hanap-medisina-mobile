# 🌿 HanapDamo Mobile Application

An offline-first, real-time machine learning mobile application built with React Native and Expo. HanapDamo utilizes an on-device TensorFlow Lite model to scan and identify medicinal plants natively. 

The system features a robust hybrid online-offline architecture. Read operations (like browsing the library) are handled directly via Firebase for high speed, while all write operations (like saving scan results) are securely routed through a custom Express.js backend for authentication validation and processing.

---

## 🏗 System Architecture & Tech Stack

**Frontend & Core Framework**
* **React Native & Expo:** Core mobile framework.
* **NativeWind (Tailwind CSS):** For rapid, utility-first UI styling.
* **Expo Router:** File-based routing and tab navigation (Library, Scan, History, Profile).

**Machine Learning & Camera Engine**
* **TensorFlow Lite (`react-native-fast-tflite`):** Runs the `.tflite` image classification model directly on the device for zero-latency offline inference.
* **React Native Vision Camera (v4):** Captures high-resolution video frames.
* **JPEG-JS & Buffer:** Manually decodes captured images into raw RGB pixels, translating them into the exact `-1.0` to `1.0` Float32 arrays required by the AI.

**Backend & Cloud Database (Three-Tier Architecture)**
* **Express.js & Node.js:** Custom backend API handling all database write operations and business logic.
* **Firebase:** Centralized cloud database (Firestore) and user authentication provider.
* **Firebase Admin SDK:** Backend middleware used to securely verify user ID tokens.
* **Axios:** Frontend HTTP client for bridging the mobile app to the Express API.

**State & Offline Management**
* **Zustand:** Global state management for tracking pending offline scans.
* **Local Storage (AsyncStorage/SQLite):** Persists "Favorited" library plants and queued scan results when the device loses network connectivity.
* **Expo Network / NetInfo:** Real-time network monitoring to toggle between Cloud-Read and Offline-Read modes.

---

## 🚀 Prerequisites

Before you clone this project, ensure your local development environment has the following installed:

1. **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
2. **[Git](https://git-scm.com/)**
3. **[Java Development Kit (JDK)](https://adoptium.net/)** (JDK 17 is recommended for React Native/Expo)
4. **Android Studio** (Required for the Android SDK to compile the native camera and C++ ML packages)
5. **ADB (Android Debug Bridge)** (Installed via Android Studio SDK Manager, required for USB debugging and backend connections)
6. **Physical Android Device** connected via USB with "USB Debugging" enabled. *(Note: Emulators cannot test the camera functionality).*

---

## ⚙️ Local Configuration (`local.properties`)

Because we do not upload private system paths to GitHub, you **must** manually create a file to tell the app where your Android SDK is located.

1. Navigate to the `android/` folder inside the project.
2. Create a new file named `local.properties`.
3. Add your specific SDK path to the file. It should look like this (replace `YOUR_USERNAME`):

**Windows:**
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
Mac:

Properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
🛠 Installation
Clone the repository:

Bash
git clone [https://github.com/YOUR_USERNAME/hanap-medisina-mobile.git](https://github.com/YOUR_USERNAME/hanap-medisina-mobile.git)
cd hanap-medisina-mobile
Install all dependencies:
(This rebuilds the node_modules folder)

Bash
npm install
📱 How to Run the App (The "Two-Terminal" Method)
Because we are using custom metro.config.js settings for the .tflite model and native C++ camera plugins, you must run the JavaScript bundler and the Android compiler separately to avoid infinite loading screens.

Terminal 1: Start the clean Metro server
Leave this terminal open. The -c flag forces Metro to clear its cache and correctly read the ML model configuration.

Bash
npx expo start -c
Terminal 2: Build the Native Android App
Open a second terminal window and run:

Bash
npx expo run:android
Once the build finishes, the app will launch automatically on your connected physical Android device!

🔌 Connecting to a Local Backend (Optional)
If you are running the custom Express backend locally on your laptop, your physical phone will not be able to reach localhost by default. Use ADB to reverse-proxy the ports so your phone can talk to your laptop's backend.

Open a terminal and run:

Bash
# Replace 8000 with your Express backend port
adb reverse tcp:8000 tcp:8000
Now, your mobile app can make Axios requests to http://localhost:8000 just like your laptop does!

🗺 Development Roadmap
✅ Phase 0: Foundation

[x] Configure Firebase (Firestore/Auth) and generate serviceAccountKey.json.

[x] Initialize Expo Tabs Template (Library, Scan, History, Profile).

[x] Initialize Express Server skeleton and link to Firebase Admin SDK.

[x] Establish Frontend-to-Backend bridge via Axios.

✅ Phase 1: The Offline Core (Current)

[x] Configure Native Camera permissions and UI.

[x] Integrate TensorFlow Lite model natively.

[x] Build image translation layer (JPEG to Float32Array).

[x] Output accurate confidence percentages entirely offline.

⏳ Phase 2: Authentication & Security

[ ] Implement Firebase Email/Password Auth on frontend.

[ ] Attach Firebase ID Tokens to Axios headers.

[ ] Build Express middleware to validate tokens before writing to database.

🚀 Phase 3: The Library and Local Storage

[ ] Connect Library tab for high-speed direct Firestore reads.

[ ] Build "Save for Offline" feature using local storage.

[ ] Implement conditional rendering (Cloud Library vs. Saved Offline Library).

🔄 Phase 4: Sync Engine (Offline & Online)

[ ] Integrate Network Monitoring (NetInfo).

[ ] Build Zustand Sync Queue for pending offline scans.

[ ] Develop "Sync Handshake" to push queued scans to Express API when reconnected.

📊 Phase 5: History & Profile

[ ] Merge Local Scans and Cloud Scans into a unified History Tab.

[ ] Build Profile UI (Logout, Account Details).

[ ] Final NativeWind UI/UX Polish.

📦 Phase 6: Production & Deployment

[ ] Deploy Express Server to cloud hosting (Render/Railway).

[ ] Point Axios baseURL to live production URL.

[ ] Generate final production APK via EAS Build (eas build -p android --profile preview).


***

Once you commit this `README.md` to your `main` branch, anyone landing on your project page will instantly understand exactly how sophisticated your offline-sync and database-write strategy is.
