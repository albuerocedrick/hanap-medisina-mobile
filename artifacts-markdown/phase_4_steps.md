# Phase 4: Network Monitoring & Sync Engine

This document details the implementation steps for Phase 4, which focuses on building the Network Monitoring & Sync Engine to enable offline capabilities for the HanapMedisina application.

---

## 🌐 Part 1: Server Side Modifications (`hanap-medisina-server`)

### Step 1. Install Dependencies ✅
* **What we do:** Install `multer` and `cloudinary` via `npm`.
* **Why:** We need `multer` to handle `multipart/form-data` (which is the format we'll use to upload images efficiently from the phone). `cloudinary` will be used to host those images in the cloud.

### Step 2. Setup Cloudinary Service (`src/services/cloudinaryService.js`) ✅
* **What we do:** Create a dedicated service file to configure Cloudinary with your API keys.
* **Why:** This will contain the helper functions to take the image files we receive from the mobile app and upload them to your Cloudinary storage, returning the public image URLs.

### Step 3. Build the Sync API Route (`src/routes/scan.routes.js` & `src/controllers/scan.controller.js`) ✅
* **What we do:** Create a new `POST /api/scans/sync` endpoint.
* **Why:** This is the endpoint the mobile app will call when it regains internet. The controller will:
  1. Verify the user's authentication token (via `auth.middleware.js`).
  2. Receive the pending scan records (including the image files).
  3. Upload the images to Cloudinary using the service we just made.
  4. Save the scan data (along with the new Cloudinary URL) into your Firestore database using the Firebase Admin SDK.

### Step 4. Update Server Entry Point (`index.js`) ✅
* **What we do:** Register the new `scanRoutes` and ensure the body parsers can handle larger payloads.

---

## 📱 Part 2: Mobile App Modifications (`hanap-medisina-mobile`)

### Step 5. Setup Axios Interceptors (`src/api/client.ts`) ✅
* **What we do:** Update your Axios configuration to intercept every outgoing API request.
* **Why:** We need to fetch the Firebase ID Token (`await auth.currentUser.getIdToken()`) and automatically attach it to the `Authorization: Bearer <token>` header so the server knows exactly who is sending the data.
* **Status:** Already implemented in the existing codebase. No changes needed.

### Step 6. Create Local Storage Queue (`src/store/useSyncStore.ts`) ✅
* **What we do:** Build a Zustand state management store.
* **Status:** Completed. Now supports background processing and progress tracking.

### Step 7. Modify Scan Tab Logic (`app/(tabs)/scan.tsx`) ✅
* **What we do:** Update the scan screen to actually **save** scan results after identification.
* **Status:** Completed. Gracefully handles online direct uploads and offline queuing.

### Step 8. Build Network Listener (`src/hooks/useNetworkSync.ts`) ✅
* **What we do:** Create a custom React hook that wraps `@react-native-community/netinfo`.
* **Status:** Completed. Uses `NetInfo.fetch()` for accurate boot-time detection.

### Step 9. Build the Sync UI (`src/components/global/SyncPromptModal.tsx`) ✅
* **What we do:** Create a pop-up modal or banner component.
* **Status:** Completed. Acts as a non-blocking trigger for background sync.

### Step 10. Inject Logic into the Root (`app/_layout.tsx`) ✅
* **What we do:** Add the `useNetworkSync` hook and the `SyncPromptModal` into your root layout file.
* **Status:** Completed. Also mounts the `SyncStatusBanner` globally.

---

## 🚀 Phase 4.1: Agile UX Refinement (Background Sync) ✅

During testing, we identified that a blocking modal was a poor user experience. We implemented the following upgrades:
1. **Background Service:** Moved the sync logic from the Modal into `useSyncStore.runSync()`.
2. **Granular Progress:** Changed sync from "Batched (10)" to "One-by-One" to allow the UI to show `Uploading 1 of 5...`.
3. **Global Status Banner:** Created `SyncStatusBanner.tsx` which slides in from the top globally, allowing the user to continue using the app while syncing happens in the background.

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────┐
│                   SCAN TAB (scan.tsx)                    │
│  User takes photo → TFLite identifies plant             │
│                                                         │
│  ┌─────────────┐         ┌──────────────┐               │
│  │   Online?    │── Yes ──▶  POST /sync  │── Firestore  │
│  └──────┬──────┘         └──────────────┘               │
│         │ No                                            │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │ enqueueScan()│── AsyncStorage (survives app close)   │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              ROOT LAYOUT (_layout.tsx)                   │
│  useNetworkSync monitors connection                     │
│                                                         │
│  Offline → Online detected + queue not empty?           │
│         │                                               │
│         ▼                                               │
│  ┌──────────────────┐      ┌────────────────────────┐   │
│  │ SyncPromptModal   │──▶  │ useSyncStore.runSync() │───┼──▶ POST /sync
│  │ (Non-blocking)    │     └──────────┬─────────────┘   │
│  └──────────────────┘                 │                 │
│                                       ▼                 │
│                            ┌────────────────────────┐   │
│                            │   SyncStatusBanner     │   │
│                            │ (Background Progress)  │   │
│                            └────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
