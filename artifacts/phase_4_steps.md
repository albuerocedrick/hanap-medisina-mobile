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

### Step 6. Create Local Storage Queue (`src/store/useSyncStore.ts`)
* **What we do:** Build a Zustand state management store.
* **Why:** This store will hold an array called `syncQueue`. When the user scans a plant offline, the scan data goes here instead of to the server. We will use Zustand's `persist` middleware paired with `@react-native-async-storage/async-storage` so that even if the user closes the app, their pending scans are saved locally.
* **Exports 3 actions:**
  - `enqueueScan(scan)` — adds a new offline scan to the queue
  - `dequeueScan(localId)` — removes a specific scan after it syncs successfully
  - `clearQueue()` — empties the entire queue after a full sync

### Step 7. Modify Scan Tab Logic (`app/(tabs)/scan.tsx`)
* **What we do:** Update the scan screen to actually **save** scan results after identification.
* **Why:** Currently, after the TFLite model identifies a plant, the result only lives in React state and is lost when the user leaves the screen. We need to persist it.
* **Logic to add after a successful scan:**
  1. **Check if the phone is online** (using NetInfo).
  2. **If online** → Send the scan directly to the server (`POST /api/scans/sync`) with the image and metadata, saving it to Firestore immediately.
  3. **If offline** → Save the scan to the local Zustand queue (`enqueueScan()`) with the image URI, plant name, confidence, and timestamp.
  4. **UI feedback** → Show a message like "Scan saved!" or "Saved offline — will sync later" so the user knows what happened.

### Step 8. Build Network Listener (`src/hooks/useNetworkSync.ts`)
* **What we do:** Create a custom React hook that wraps `@react-native-community/netinfo`.
* **Why:** This hook constantly monitors the phone's internet connection. If the connection changes from "Offline" to "Online" **AND** there are items sitting in our `syncQueue`, it fires a trigger to show the sync prompt.

### Step 9. Build the Sync UI (`src/components/SyncPromptModal.tsx`)
* **What we do:** Create a pop-up modal or banner component.
* **Why:** When the custom hook detects the internet is back, this modal will appear globally asking: *"You are back online. You have X pending scans. Sync now?"*
* **On "Sync Now":**
  1. Bundles the pending scans from `useSyncStore` into `multipart/form-data`.
  2. Sends them to the Express backend via Axios (`POST /api/scans/sync`).
  3. For each successfully synced scan, calls `dequeueScan(localId)` to remove it from the queue.
  4. Shows success/failure feedback to the user.

### Step 10. Inject Logic into the Root (`app/_layout.tsx`)
* **What we do:** Add the `useNetworkSync` hook and the `SyncPromptModal` into your root layout file.
* **Why:** By putting it in the root layout, the app will monitor the network and be able to prompt the user to sync regardless of which tab or screen they are currently looking at.

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
│  ┌──────────────────┐                                   │
│  │ SyncPromptModal   │── "Sync now?" ── POST /sync      │
│  │ appears globally  │── success? ── dequeueScan()      │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```
