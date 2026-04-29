# Phase 5: File-by-File Task List (Chronological Order)

This list breaks down the implementation of Phase 5 (History, Profile & Media Polish) into a chronological step-by-step process.

---

## 🌐 Phase 5.1: Backend Media Infrastructure (`hanap-medisina-server`)

### 1. `src/services/cloudinary.service.js` (Media Service)
- [x] **Helper Function:** Create/ensure `uploadBuffer` exists to handle `multer` memory storage buffers.
- [x] **Optimization:** Add transformations (e.g., `width: 256, height: 256, crop: 'fill', gravity: 'face'`) to optimize avatar delivery.

### 2. `src/controllers/user.controller.js` (Avatar Controller)
- [x] **Function `updateAvatar`:**
    - [x] Access file buffer via `req.file.buffer`.
    - [x] Call `cloudinaryService.uploadBuffer`.
    - [x] Update Firebase Auth: `admin.auth().updateUser(uid, { photoURL: url })`.
    - [x] Update Firestore: `admin.firestore().collection('users').doc(uid).update({ photoURL: url })`.
    - [x] Return the new URL in response.

### 3. `src/routes/user.routes.js` (Route Definition)
- [x] **Middleware Imports:** Import `authMiddleware` and `multer` (configured for memory storage).
- [x] **New Route:** Add `router.post('/avatar', authMiddleware, upload.single('avatar'), userController.updateAvatar)`.

---

## 📱 Phase 5.2: Frontend History Features (`hanap-medisina-mobile`)

### 4. `app/(tabs)/history/index.tsx` (Unified Scan History)
*(Note: Requires renaming `app/(tabs)/history.tsx` to `app/(tabs)/history/index.tsx`)*
- [x] **Folder Structure:** Create `app/(tabs)/history/` directory and move the history file inside as `index.tsx`.
- [x] **Import Hooks:** Import `useSyncStore` (Zustand) and Firebase Firestore hooks.
- [x] **Fetch Cloud Data:** Use `query`, `collection`, `where('userId', '==', uid)`, and `orderBy('createdAt', 'desc')` to get synced scans.
- [x] **Retrieve Local Data:** Get the `syncQueue` from `useSyncStore`.
- [x] **Merge Logic:** Create a unified `historyData` array by merging cloud and local data.
- [x] **Sort:** Ensure the final list is sorted by timestamp descending.
- [x] **UI Implementation:** 
    - [x] Render a `FlatList`.
    - [x] Add a "Pending Sync" visual badge for items originating from the `syncQueue`.

### 5. `app/(tabs)/history/[id].tsx` (Scan Details Page)
- [x] **Route Setup:** Use `useLocalSearchParams` to get the `id`.
- [x] **Data Fetching Logic:**
    - [x] Check if `id` exists in `useSyncStore.syncQueue`.
    - [x] If not, fetch document from Firestore `scans` collection.
- [x] **UI Layout:**
    - [x] Display plant image (Cloudinary URL or local `file://` URI).
    - [x] Show scientific name, common name, and identification confidence.
    - [x] Render care facts/medical info.

---

## 📱 Phase 5.3: Frontend Profile Polish (`hanap-medisina-mobile`)

### 6. `app/(tabs)/profile.tsx` (User Profile & Avatar)
- [ ] **Dependency Setup:** Ensure `expo-image-picker` is installed and configured.
- [ ] **Stats Query:** Fetch the count of documents in `scans` for the current user.
- [ ] **Avatar Logic:**
    - [ ] Implement `pickImage` using `ImagePicker.launchImageLibraryAsync`.
    - [ ] Implement `uploadAvatar` function:
        - [ ] Create `FormData`.
        - [ ] Send `POST /api/users/avatar` via Axios `client.ts`.
        - [ ] On success, call `auth.currentUser.reload()`.
- [ ] **UI Polish:** 
    - [ ] Add an "Edit" button over the avatar.
    - [ ] Show loading state while uploading to prevent duplicate submissions.
    - [ ] Display user stats (Total Scans, Saved Plants).

---

## ✅ Verification Checklist
- [ ] **Backend Test:** Does the `/api/users/avatar` endpoint correctly accept `multipart/form-data` and return a Cloudinary URL?
- [ ] **Sync Indicator:** Do offline scans show up in History with a "Pending" badge?
- [ ] **Navigation:** Can you click a history item and navigate cleanly between `index.tsx` and `[id].tsx`?
- [ ] **Avatar Upload:** Does picking a new photo update the UI, Cloudinary, and Firebase Auth?
