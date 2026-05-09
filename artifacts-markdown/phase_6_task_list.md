# Phase 6: File-by-File Task List (Home Tab & Polish)

---

## 🌐 Phase 6.1: Backend History Controls (`hanap-medisina-server`)

### 1. `src/controllers/scan.controller.js`
- [ ] **Function `deleteScan`:**
    - [ ] Get `scanId` from `req.params.id`.
    - [ ] Verify document exists in `users/{uid}/scans/{scanId}`.
    - [ ] Delete document from Firestore.
    - [ ] Send `200 OK` response.
- [ ] **Function `toggleFavorite`:**
    - [ ] Get `scanId` from `req.params.id` and `isFavorite` (boolean) from `req.body`.
    - [ ] Update `isFavorite` field in Firestore.
    - [ ] Send `200 OK` response.

### 2. `src/routes/scan.routes.js`
- [ ] **Route Setup:**
    - [ ] Add `router.delete('/:id', verifyFirebaseToken, deleteScan)`.
    - [ ] Add `router.patch('/:id/favorite', verifyFirebaseToken, toggleFavorite)`.

---

## 📱 Phase 6.2: Frontend Advanced History (`hanap-medisina-mobile`)

### 3. `src/services/firebaseHistory.ts`
- [ ] **Query Updates:**
    - [ ] Modify `getPaginatedUserScans` to accept a `filter` argument (`'all' | 'favorites'`).
    - [ ] Add `where("isFavorite", "==", true)` to the query if the filter is active.

### 4. `app/(tabs)/history/index.tsx`
- [ ] **Filter UI:**
    - [ ] Add state `activeFilter` ('all' or 'favorites').
    - [ ] Render a horizontal row of filter chips below the header.
    - [ ] Trigger a refresh (`fetchInitialScans`) when the filter changes.

### 5. `src/components/history/scan-detail-sheet.tsx`
- [ ] **Favorite Button:**
    - [ ] Add a Heart icon to the header.
    - [ ] On press, call `PATCH /api/scans/:id/favorite` via Axios.
    - [ ] Optimistically update the local UI state.
- [ ] **Delete Button:**
    - [ ] Add a Trash icon to the header or bottom of the sheet.
    - [ ] On press, show a confirmation `Alert`.
    - [ ] If confirmed, call `DELETE /api/scans/:id` via Axios.
    - [ ] Close the sheet and trigger a list refresh on the History tab.

---

## 📱 Phase 6.3: The Home Dashboard (`hanap-medisina-mobile`)

### 6. `app/(tabs)/index.tsx`
- [ ] **Header:** 
    - [ ] Implement personalized greeting using `user.displayName`.
- [ ] **Quick Actions:**
    - [ ] "Take a Scan" button (routes to `/scan` or triggers camera).
    - [ ] "Browse Library" button (routes to `/library`).
- [ ] **Favorites Carousel:**
    - [ ] Fetch top 5 recent favorite scans from Firestore.
    - [ ] Render them in a horizontal `ScrollView` or `FlatList`.
    - [ ] Show empty state if no favorites exist ("Star a scan to see it here!").
- [ ] **Design Polish:**
    - [ ] Ensure the screen uses the premium tokens (dark green, subtle shadows).

---

## ✅ Phase 6 Verification Checklist
- [ ] **Backend Deletion:** Does deleting a scan actually remove the document from Firestore?
- [ ] **Filtering:** Does tapping the "Favorites" chip instantly filter out non-favorited scans?
- [ ] **Home Feed:** Does favoriting a scan immediately make it appear in the Home Tab carousel?
- [ ] **UX Flow:** Are there appropriate loading spinners and success/error alerts for network actions?
