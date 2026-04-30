# Phase 5 Implementation Plan: History, Profile & Media Polish

## 1. Overview
Phase 5 focuses on unifying the offline and online experiences through a combined History view, implementing user profile management (including avatar uploads), and polishing the media handling system. This plan ensures strict adherence to the defined **Hybrid Online-Offline Three-Tier Architecture** and is structured in a chronological sequence for implementation.

## 2. Architectural Rules & Data Flow
*   **The Read/Write Split:** Scan history and user profile data MUST be read *directly* from Firestore using the Firebase JS SDK on the mobile frontend. Any writes (e.g., uploading a new avatar) MUST be sent to the Express backend via Axios.
*   **Offline-First Principles:** The History view must seamlessly merge offline-pending scans (from Zustand `useSyncStore`) with synchronized cloud scans, prioritizing user experience regardless of network state.
*   **Authentication Bridge:** The backend must rely on the existing `authMiddleware` to decode the Firebase ID Token and identify the user before allowing any profile modifications.

---

## 3. Chronological Implementation Steps

### Step 1: Backend Media Infrastructure (`hanap-medisina-server`)
Before the frontend can upload avatars, the backend needs the necessary endpoints and media handling logic.

#### A. Media Optimization (`src/services/cloudinary.service.js` or similar)
**Goal:** Optimize avatar images for fast delivery.
1.  Configure the Cloudinary upload function to apply transformations on the fly (e.g., crop to a square aspect ratio, resize to 256x256, and compress quality) to reduce mobile data usage.

#### B. Controller Logic (`src/controllers/user.controller.js` or `src/controllers/profile.controller.js`)
**Goal:** Process the media, upload to the CDN, and update the database.
1.  **Validation:** Verify that `req.file` exists and is a valid image type.
2.  **Cloudinary Integration:** Stream the Multer file buffer to Cloudinary, specifying an appropriate folder (e.g., `hanap_medisina/avatars`).
3.  **Database Updates:** Update the user's profile using the `firebase-admin` SDK (`admin.auth().updateUser`) and update the user's document in the Firestore `users` collection.
4.  **Response:** Send a `200 OK` JSON response containing the new `photoURL`.

#### C. Route Modifications (`src/routes/user.routes.js` or `src/routes/profile.routes.js`)
**Goal:** Create a secure endpoint for handling avatar media.
1.  **New Endpoint:** `POST /avatar`.
2.  **Middleware Stack:** Use `authMiddleware` to authenticate the request and `upload.single('avatar')` to process `multipart/form-data`.

---

### Step 2: Frontend History Features (`hanap-medisina-mobile`)
With the backend established, proceed to build the unified offline/online history views.

#### A. History View (`app/(tabs)/history/index.tsx`)
**Goal:** Display a unified list of all past plant scans with high performance.
1.  **Pagination:** Implement infinite scrolling using `getDocs` with `startAfter` to avoid loading the entire collection. Use `getCountFromServer` for efficient total counts.
2.  **Merge & Sort:** Combine local `syncQueue` items and remote Firestore items. Dedup items that have transitioned from local to cloud.
3.  **UI Representation:** Render the combined list using `FlatList`. Group UI into `HistoryHeader`, `HistoryCard`, and `HistoryEmptyState`.

#### B. Scan Details Modal (`src/components/history/scan-detail-sheet.tsx`)
**Goal:** Provide an in-depth view of a specific scan via a responsive bottom sheet.
1.  **Modal Architecture:** Use a `Modal` (Bottom Sheet) instead of a separate screen route for faster interactions.
2.  **Dual-Source Retrieval:** Check `syncQueue` first (for offline scans), then fall back to Firestore.
3.  **Library Integration:** Cross-reference the identified plant with the Library collection to show a reference image and link to the full plant documentation.
4.  **Manual Retry:** Provide a "Retry Sync" button for scans that failed automatic sync attempts (blacklisted items).

---

### Step 3: Frontend Profile Polish (`hanap-medisina-mobile`)
Finally, connect the frontend profile screen to the new backend avatar endpoints.

#### A. Profile Dashboard (`app/(tabs)/profile.tsx` and `src/components/profile/`)
**Goal:** Allow users to manage their account and upload an avatar.
1.  **Component Architecture:** Break down the UI into smaller, reusable components inside `src/components/profile/` (e.g., `ProfileHeader`, `StatsCard`).
2.  **Image Selection:** Integrate `expo-image-picker` to allow the user to select an image from their device gallery or camera.
3.  **Upload Request:**
    *   Construct a `FormData` object appending the selected image file.
    *   Send a `POST` request to `/api/users/avatar` via the pre-configured Axios `client.ts`.
4.  **State Update:** Upon a successful response from the backend, update the local Firebase Auth state (`auth.currentUser.reload()`) to reflect the newly uploaded `photoURL` and trigger a re-render.
5.  **Statistics & Meta:** 
    *   Query and display aggregate data, such as total scans performed using `getTotalScansCount`.
    *   Display the user's account creation date formatted as "Member since [Month] [Year]" (extracted from Firebase Auth metadata).

---

## 4. DevSecOps & QA Considerations
*   **File Validation:** Multer configuration MUST restrict uploads to image mime types and enforce a strict file size limit (5MB).
*   **Race Conditions:** Disable upload buttons and show loading spinners while requests are pending.
*   **Offline Robustness:** Guard all network-dependent functions (pagination, manual retry) with network status checks to prevent silent failures.
