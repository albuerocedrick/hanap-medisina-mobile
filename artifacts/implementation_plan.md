# Implementation Plan: HanapMedisina Phases 4, 5 & 6

This plan outlines the architecture and implementation steps for completing Phase 4 (Network Monitoring & Sync Engine), Phase 5 (History, Profile & Media Polish), and Phase 6 (Production & Deployment) of the HanapMedisina application.

## Approved Decisions

> [!NOTE]
> The user has approved this implementation plan with the following clarifications:
> 1. **Image Upload Format:** We will use `multipart/form-data` for syncing offline scans to the backend for better performance.
> 2. **Scan History Fetching:** We will fetch the scan history directly via the Firebase JS SDK on the frontend, strictly adhering to the frontend-reads / backend-writes architecture.
> 3. **EAS Configuration:** EAS configuration will be handled by the user after Phase 5 is complete.

## Proposed Changes

---

### Mobile Application (`hanap-medisina-mobile`)

#### [NEW] `src/store/useSyncStore.ts` (Phase 4)
- Create a Zustand store named `useSyncStore`.
- Use Zustand's `persist` middleware with `@react-native-async-storage/async-storage` to ensure the queue survives app restarts.
- **State/Actions:** `syncQueue` (array of offline scans), `enqueueScan(scan)`, `dequeueScan(scanId)`, `clearQueue()`.

#### [NEW] `src/hooks/useNetworkSync.ts` (Phase 4)
- Create a custom hook that wraps `@react-native-community/netinfo`.
- Tracks the `isConnected` state.
- Triggers a callback when the state transitions from `offline -> online` and the `syncQueue` is not empty.

#### [NEW] `src/components/SyncPromptModal.tsx` (Phase 4)
- A global UI modal/banner that prompts the user: "You are back online. You have X pending scans. Sync now?"
- Connects to the Express backend (`POST /api/scans/sync`) to upload the items in `useSyncStore`.

#### [MODIFY] `app/_layout.tsx` or `app/(tabs)/_layout.tsx` (Phase 4)
- Inject the `useNetworkSync` hook and render the `SyncPromptModal` at the root layout so it triggers regardless of which tab the user is on.

#### [NEW] `app/(tabs)/history.tsx` (Phase 5)
- **Unified History List:** Fetches cloud history directly from Firestore (using `firebase/firestore`).
- Combines the cloud history list with local pending scans from `useSyncStore`.
- Implements a filter/search bar.

#### [NEW] `app/(tabs)/history/[id].tsx` (Phase 5)
- Detailed scan result page showing the image, confidence level, and identification facts.

#### [NEW] `app/(tabs)/profile.tsx` (Phase 5)
- User dashboard displaying statistics (Total Scans, Species Identified, Total Saved).
- Includes an Image Picker for updating the profile picture.
- Sends the image to the Express backend (`POST /api/profile/avatar`).

#### [MODIFY] `src/api/axios.ts` (Phase 4-6)
- Update base URL to use `process.env.EXPO_PUBLIC_API_URL`.
- Implement Axios interceptors to automatically attach the Firebase ID token (`await auth.currentUser.getIdToken()`) to the `Authorization: Bearer <token>` header for all requests.

---

### Express Server (`hanap-medisina-server`)

#### [MODIFY] `package.json` (Phase 4/5)
- Add dependencies: `npm install cloudinary multer`. (Multer handles `multipart/form-data` parsing for image uploads).

#### [NEW] `src/middleware/authMiddleware.js` (Phase 2/4)
- Middleware using `firebase-admin` to decode the incoming Bearer token and attach the `uid` to the request (`req.user = decodedToken`).

#### [NEW] `src/services/cloudinaryService.js` (Phase 4/5)
- Configuration and helper functions for uploading image buffers/files to Cloudinary.

#### [NEW] `src/routes/scanRoutes.js` & `src/controllers/scanController.js` (Phase 4)
- `POST /api/scans/sync`: Protected route. Receives one or multiple scan records (with images).
- Uploads images to Cloudinary, then writes the scan metadata + Cloudinary image URL to Firestore using Admin SDK.

#### [NEW] `src/routes/profileRoutes.js` & `src/controllers/profileController.js` (Phase 5)
- `POST /api/profile/avatar`: Protected route. Receives an image, uploads to Cloudinary, and updates the user's `photoURL` in Firebase Auth and/or their Firestore user document.

#### [MODIFY] `index.js` (Phase 4-6)
- Register `scanRoutes` and `profileRoutes`.
- Increase `body-parser` limits if images are sent as Base64 (e.g., `express.json({ limit: '50mb' })`).

---

### Production & Deployment (Phase 6)

#### Mobile Application
- **Environment Variables:** Create `.env.production` with the live API URL.
- **EAS Build:** Configure `eas.json` for a preview build. Run `eas build -p android --profile preview` to generate the APK.

#### Express Server
- Ensure `PORT` is dynamically mapped (`process.env.PORT || 3000`).
- Ensure CORS is configured properly to accept requests from the mobile app (or left open `*` for mobile apps).
- Deployment instructions for Render/Railway (connecting the GitHub repo and injecting environment variables).

## Verification Plan

### Automated/Manual Verification
1. **Network Simulation:** Toggle device Wi-Fi/Data off. Scan a plant. Verify the item is stored in Zustand (`AsyncStorage`).
2. **Reconnection Hook:** Toggle Wi-Fi back on. Verify the UI modal prompts for synchronization.
3. **Backend Integration:** Approve the sync, and verify the Express backend receives the data, uploads the image to Cloudinary, and writes to Firestore.
4. **History UI:** Verify the History tab shows both local "Pending" scans and remote "Synced" scans correctly.
5. **Profile Upload:** Pick a new profile picture and verify it reflects in Cloudinary and the App UI.
6. **EAS Build:** Confirm the `eas build` command successfully produces an installable Android `.apk`.
