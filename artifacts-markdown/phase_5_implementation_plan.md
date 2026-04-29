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
*Note: This replaces the previous `history.tsx` to allow nested routing.*
**Goal:** Display a unified list of all past plant scans.
1.  **Cloud Data Fetching:** Use `useFocusEffect` or a Firestore `onSnapshot` listener to fetch the user's scan documents from the `scans` collection (`where('userId', '==', currentUser.uid)`), ordered by `createdAt` descending.
2.  **Local Data Access:** Retrieve the `syncQueue` array from the existing `useSyncStore`.
3.  **Merge & Sort:** Combine the local `syncQueue` items and the remote Firestore items into a single array. Sort the combined array by timestamp.
4.  **UI Representation:** Render the combined list. Local, unsynced items MUST display a visual indicator (e.g., a cloud with a slash icon, or "Pending Sync" tag).

#### B. Scan Details View (`app/(tabs)/history/[id].tsx`)
**Goal:** Provide an in-depth view of a specific scan from history.
1.  **Routing:** Utilize Expo Router's local parameters to receive the scan ID.
2.  **Dual-Source Retrieval:**
    *   If the ID corresponds to an offline scan, retrieve the data from `useSyncStore`.
    *   Otherwise, fetch the specific document from the Firestore `scans` collection.
3.  **UI Components:** Display the high-resolution image, the identified species name, confidence percentage, and any associated care instructions.

---

### Step 3: Frontend Profile Polish (`hanap-medisina-mobile`)
Finally, connect the frontend profile screen to the new backend avatar endpoints.

#### A. Profile Dashboard (`app/(tabs)/profile.tsx`)
**Goal:** Allow users to manage their account and upload an avatar.
1.  **Image Selection:** Integrate `expo-image-picker` to allow the user to select an image from their device gallery or camera.
2.  **Upload Request:**
    *   Construct a `FormData` object appending the selected image file.
    *   Send a `POST` request to `/api/users/avatar` via the pre-configured Axios `client.ts`.
3.  **State Update:** Upon a successful response from the backend, update the local Firebase Auth state (`auth.currentUser.reload()`) to reflect the newly uploaded `photoURL` and trigger a re-render.
4.  **Statistics (Optional Polish):** Query and display aggregate data, such as total scans performed.

---

## 4. DevSecOps & QA Considerations
*   **File Validation:** Multer configuration MUST restrict uploads to image mime types (`image/jpeg`, `image/png`, `image/webp`) and enforce a strict file size limit (e.g., 5MB).
*   **Race Conditions:** The mobile UI MUST disable the avatar upload button and show a loading spinner while the upload request is pending to prevent duplicate submissions.
*   **Error Handling:** Ensure the backend gracefully handles Cloudinary upload failures and returns appropriate HTTP error codes without crashing the Express process.
