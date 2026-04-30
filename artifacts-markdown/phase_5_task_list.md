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
- [x] **Architecture Upgrade:** Implement pagination and infinite scrolling via `src/services/firebaseHistory.ts` to prevent memory/billing issues.
- [x] **Fetch Cloud Data:** Use `getPaginatedUserScans` to fetch data in chunks of 10 and `getTotalScansCount` for efficient counting.
- [x] **Retrieve Local Data:** Get the `syncQueue` from `useSyncStore`.
- [x] **Merge Logic:** Create a unified `displayData` array by merging cloud and local data, sorting by timestamp.
- [x] **UI Implementation:** 
    - [x] Render a `FlatList` with `onEndReached` for infinite scrolling.
    - [x] Extract UI into reusable components: `HistoryCard`, `HistoryHeader`, and `HistoryEmptyState`.

### 5. `src/components/history/scan-detail-sheet.tsx` (Scan Details Modal)
*(Note: This replaces the previous `app/(tabs)/history/[id].tsx` route)*
- [x] **Route Setup:** Implement as a Bottom Sheet Modal instead of a separate screen for better UX.
- [x] **Data Fetching Logic:**
    - [x] Check if `scanId` exists in `useSyncStore.syncQueue`.
    - [x] If not, fetch document via `getScanById`.
- [x] **UI Layout:**
    - [x] Display side-by-side images (User Scan vs Library Reference).
    - [x] Show confidence bar, sync status, and capture date.
    - [x] Add "View Full Plant Info" button to route to the Library page.
- [x] **Manual Retry Feature:**
    - [x] Implement "Retry Sync" button specifically for items with `retryCount >= 3`.
    - [x] Reset `retryCount` and trigger `runSync()` from the bottom sheet.
    - [x] Handle loading and offline states for the retry button.

---

## 📱 Phase 5.3: Frontend Profile Polish (`hanap-medisina-mobile`)

### 6. `app/(tabs)/profile.tsx` + `src/components/profile/` (User Profile & Avatar)
- [x] **Dependency Setup:** `expo-image-picker` integrated for media selection.
- [x] **Component Extraction:**
    - [x] `profile-avatar.tsx` — avatar with edit-button overlay and upload state.
    - [x] `profile-stats.tsx` — Total Scans & Member Since stat pills.
    - [x] `profile-menu-item.tsx` — reusable row for settings/actions.
- [x] **Data Fetching:**
    - [x] Fetch the count of documents in `scans` via `getTotalScansCount`.
    - [x] Derive "Member since [Month] [Year]" from `user.metadata.creationTime`.
- [x] **Avatar Logic:**
    - [x] Implement `handlePickImage` using `ImagePicker.launchImageLibraryAsync`.
    - [x] Implement `uploadAvatar` flow:
        - [x] Build `FormData` with the selected image asset.
        - [x] Send `POST /api/user/avatar` via authenticated Axios `client.ts`.
        - [x] On success, call `auth.currentUser.reload()` and push to `setUser()`.
- [x] **UI Polish:**
    - [x] Camera icon overlaid on avatar triggers picker; shows `ActivityIndicator` while uploading.
    - [x] Stats row is disabled/grayed during loading state.
    - [x] Logout confirmation alert with destructive styling.

---

## ✅ Verification Checklist
- [x] **Backend Test:** Does the `/api/user/avatar` endpoint correctly accept `multipart/form-data` and return a Cloudinary URL?
- [x] **Sync Indicator:** Do offline scans show up in History with a "Pending" badge?
- [x] **Infinite Scroll:** Does scrolling down trigger `fetchNextPage` and load more cloud history?
- [x] **Manual Retry:** Does the "Retry Sync" button appear for failed scans and successfully trigger a new sync attempt?
- [x] **Avatar Upload:** Does picking a new photo update the UI, Cloudinary, and Firebase Auth?
