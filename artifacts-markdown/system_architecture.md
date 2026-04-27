# HanapMedisina System Architecture

This document defines the comprehensive architecture of the HanapMedisina application, spanning from Phase 1 to Phase 6. It is specifically structured to serve as context for Agent Skills, ensuring strict adherence to the defined data flows, file structures, and technological constraints.

---

## 1. High-Level Architecture Overview

HanapMedisina employs a **Hybrid Online-Offline Three-Tier Architecture**. 

1.  **Frontend (Presentation & Edge Computing):** React Native (Expo Router) mobile app responsible for UI, offline machine learning (TFLite), and state management.
2.  **Backend (Business Logic & Validation):** Express.js server responsible for secure write operations and media processing.
3.  **Data & Storage (Cloud Services):** Firebase (Authentication & Firestore) for centralized data, and Cloudinary for optimized image hosting.

---

## 2. Core Architectural Principles & Data Flow

Agents generating code for this system MUST adhere strictly to these rules:

*   **The Read/Write Split Rule:**
    *   **READS:** The frontend mobile app reads data *directly* from Firebase Firestore using the Firebase JS SDK (`firebase/firestore`). This ensures fast, real-time list rendering.
    *   **WRITES:** The frontend *never* writes directly to Firestore. All write operations (scans, profile updates) are sent to the Express backend via Axios. The backend validates the request, uploads media, and uses the Firebase Admin SDK to perform the database write.
*   **The Authentication Bridge:** 
    *   The frontend handles login/signup via `firebase/auth`. 
    *   An Axios interceptor on the frontend attaches the Firebase ID Token (`user.getIdToken()`) to every backend request (`Authorization: Bearer <token>`).
    *   The backend middleware (`firebase-admin`) decodes this token to verify the user's identity before processing writes.
*   **The Offline-First Principle:** 
    *   Features like scanning operate independently of the network using on-device ML.
    *   Network state transitions (Offline -> Online) are actively monitored.

---

## 3. Technology Stack Requirements

*   **Mobile Workspace (`hanap-medisina-mobile`)**
    *   Framework: React Native / Expo (Router)
    *   Styling: NativeWind (TailwindCSS)
    *   State Management: Zustand
    *   Network Requests: Axios
    *   Local Storage: `@react-native-async-storage/async-storage`
    *   Hardware/ML: `react-native-vision-camera`, `react-native-fast-tflite`
*   **Server Workspace (`hanap-medisina-server`)**
    *   Framework: Express.js (Node.js)
    *   Database SDK: `firebase-admin`
    *   Media Handling: `multer` (for `multipart/form-data`), `cloudinary`

---

## 4. Workspace Directory Mapping

Agent scripts should target these specific directories when building features:

### Frontend Directory
*   `app/`: Contains Expo Router screens (`(tabs)`, `(auth)`, `_layout.tsx`).
*   `src/api/`: Contains `client.ts` (Axios instance with auth interceptors).
*   `src/components/`: Reusable UI components (e.g., `SyncPromptModal.tsx`).
*   `src/hooks/`: Custom React hooks (e.g., `useNetworkSync.ts`).
*   `src/services/`: Third-party initializations (`firebase.ts`).
*   `src/store/`: Zustand stores (`useAuthStore.ts`, `useSyncStore.ts`).

### Backend Directory
*   `src/controllers/`: Business logic for handling requests.
*   `src/middleware/`: Request interception (e.g., `authMiddleware.js`).
*   `src/routes/`: Express router definitions.
*   `src/services/`: External service wrappers (e.g., `cloudinaryService.js`).
*   `index.js`: Main server entry point.

---

## 5. Phase-by-Phase Technical Blueprint

When crafting Agent Skills for specific phases, reference these technical expectations:

### Phase 1: The Offline Core (Edge AI)
*   **Objective:** Execute plant recognition entirely offline.
*   **Implementation:** Utilize `react-native-vision-camera` frame processors to pass live camera feeds to a local `.tflite` model via `react-native-fast-tflite`. Requires a Float32Array conversion layer for image data.

### Phase 2: Authentication & Security (The Bridge)
*   **Objective:** Secure user sessions and backend endpoints.
*   **Implementation:** Frontend utilizes `onAuthStateChanged` to manage navigation state in `_layout.tsx`. Backend implements a reusable `verifyToken` middleware parsing headers and returning `req.user.uid`.

### Phase 3: The Deep Library & Offline Favorites
*   **Objective:** Browse and locally save plant data.
*   **Implementation:** Frontend utilizes direct Firestore `getDocs()` for the Library list. A "Favorite" action saves the plant data stringified into `AsyncStorage` (via a Zustand store) to bypass network requirements during offline mode.

### Phase 4: Network Monitoring & Sync Engine
*   **Objective:** Capture data offline and safely transmit it when reconnected.
*   **Implementation:** 
    1.  A Zustand store (`useSyncStore`) utilizing `persist` middleware caches offline scan metadata and local `file://` URIs.
    2.  `@react-native-community/netinfo` triggers a UI prompt upon reconnection.
    3.  Frontend sends data via `FormData` to `POST /api/scans/sync`.
    4.  Backend `multer` middleware buffers the image, uploads to Cloudinary, and writes the resulting secure URL and metadata to Firestore.

### Phase 5: History, Profile & Media Polish
*   **Objective:** Unify data views and handle user media.
*   **Implementation:** 
    *   **History:** The UI merges the local Zustand `syncQueue` array with the cloud `getDocs()` array, sorting by timestamp.
    *   **Profile:** Expo Image Picker captures avatars, sent as `multipart/form-data` to `POST /api/profile/avatar`, which is uploaded to Cloudinary, updating the user's `photoURL` in Firebase Auth.

### Phase 6: Production & Deployment
*   **Objective:** Prepare binaries and cloud hosting.
*   **Implementation:** Mobile requires `.env.production` pointing to the live backend, built using `eas build`. Server requires CORS configurations to accept mobile traffic and dynamic `process.env.PORT` binding.
