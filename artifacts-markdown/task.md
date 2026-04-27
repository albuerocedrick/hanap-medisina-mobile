# HanapMedisina Task Tracker

## Phase 4: Network Monitoring & Sync Engine
- [ ] Server: Install `multer` and `cloudinary` dependencies.
- [ ] Server: Create `src/services/cloudinaryService.js`.
- [ ] Server: Set up `POST /api/scans/sync` route and controller for `multipart/form-data` uploads.
- [ ] Mobile: Create Zustand store `src/store/useSyncStore.ts` with AsyncStorage persist.
- [ ] Mobile: Create custom hook `src/hooks/useNetworkSync.ts`.
- [ ] Mobile: Create `SyncPromptModal.tsx` component.
- [ ] Mobile: Inject `useNetworkSync` and `SyncPromptModal` into the root layout `app/_layout.tsx`.
- [ ] Mobile: Implement the logic to send `multipart/form-data` sync requests via Axios.

## Phase 5: History, Profile & Media Polish
- [ ] Mobile: Build `app/(tabs)/history.tsx` (fetch via Firebase JS SDK + merge local queue).
- [ ] Mobile: Build `app/(tabs)/history/[id].tsx` (detailed scan results).
- [ ] Mobile: Build `app/(tabs)/profile.tsx` (user stats, avatar update UI).
- [ ] Server: Set up `POST /api/profile/avatar` route and controller for avatar uploads.
- [ ] Mobile: Update Axios interceptors for Firebase ID tokens.
- [ ] Mobile: Final polish of offline empty states.

## Phase 6: Production & Deployment
- [ ] Server: Finalize for deployment (port, cors, limits).
- [ ] Mobile: Setup `.env.production` with live API URL.
- [ ] Mobile: User handles EAS build configuration.
