# Phase 4: Offline Network Sync — Testing Checklist

> **Prerequisites before testing:**
> - Express server running (`npm run dev` in `hanap-medisina-server`)
> - Mobile app running on a physical Android device (`npx expo run:android`)
> - Cloudinary env vars set in `.env` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
> - User is logged in with a verified email account

---

## Test 1: Online Scan → Direct Upload

**Goal:** Verify that scanning while online sends data directly to Cloudinary + Firestore.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 1.1 | Ensure device has WiFi/mobile data **ON** | Network status is online | ☐ |
| 1.2 | Open the **Scan** tab | Camera preview is visible with green reticle | ☐ |
| 1.3 | Point at a plant leaf and tap the **scan button** | Spinner appears → "Analyzing Leaf..." text | ☐ |
| 1.4 | Wait for AI result | Result card appears with plant name + confidence % | ☐ |
| 1.5 | Check the **status banner** below the result | Shows **"✅ Scan saved to cloud!"** | ☐ |
| 1.6 | Banner disappears after ~3 seconds | Auto-clears | ☐ |
| 1.7 | Open **Cloudinary dashboard** → Media Library | A new image exists in `hanap-medisina/scans/{uid}/` | ☐ |
| 1.8 | Open **Firebase Console** → Firestore → `users/{uid}/scans` | A new document exists with `plantName`, `confidence`, `imageUrl`, `scannedAt`, `syncedAt` | ☐ |
| 1.9 | Check the device's `offline-scans/` folder (via file manager or logs) | **Empty** — the local copy was cleaned up after upload | ☐ |

---

## Test 2: Offline Scan → Queue Locally

**Goal:** Verify that scanning while offline saves to the local queue instead of crashing.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 2.1 | Turn **Airplane Mode ON** (WiFi + mobile data off) | Device is fully offline | ☐ |
| 2.2 | Open the **Scan** tab | Camera preview still works (camera is local hardware) | ☐ |
| 2.3 | Scan a plant leaf | AI result card appears (TFLite runs locally, no server needed) | ☐ |
| 2.4 | Check the **status banner** | Shows **"📱 Saved offline — will sync later"** | ☐ |
| 2.5 | Scan **2 more** plants while still offline | Each shows the offline banner | ☐ |
| 2.6 | Force-close the app completely (swipe away from recents) | App closes | ☐ |
| 2.7 | Re-open the app (still in airplane mode) | App loads normally, no crash | ☐ |
| 2.8 | **No sync modal appears** (because we're still offline) | Modal does NOT show | ☐ |

---

## Test 3: Offline → Online Transition → Sync Modal

**Goal:** Verify the reconnect detection triggers the sync prompt and uploads work.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 3.1 | Starting state: 3 scans in offline queue (from Test 2), airplane mode ON | — | ☐ |
| 3.2 | Turn **Airplane Mode OFF** (re-enable WiFi) | Device reconnects to internet | ☐ |
| 3.3 | Wait 1-3 seconds | **Sync modal pops up**: "You're Back Online! You have 3 offline scans..." | ☐ |
| 3.4 | Tap **"Sync Now"** | Spinner appears with progress text: "Uploading 1 to 3 of 3..." | ☐ |
| 3.5 | Wait for upload to complete | Modal dismisses automatically | ☐ |
| 3.6 | Check **Cloudinary** | 3 new images in `hanap-medisina/scans/{uid}/` | ☐ |
| 3.7 | Check **Firestore** `users/{uid}/scans` | 3 new documents with correct `plantName` and timestamps | ☐ |
| 3.8 | Check device storage | `offline-scans/` folder is empty (cleaned up) | ☐ |

---

## Test 4: "Maybe Later" Dismissal

**Goal:** Verify the user can postpone syncing without losing data.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 4.1 | Go offline → scan 1 plant → go back online | Sync modal appears | ☐ |
| 4.2 | Tap **"Maybe Later"** | Modal dismisses | ☐ |
| 4.3 | Navigate to other tabs (Library, Profile, etc.) | App works normally, no crash | ☐ |
| 4.4 | Go offline again, then back online | Sync modal reappears with the same scan still pending | ☐ |
| 4.5 | This time tap **"Sync Now"** | Upload succeeds, queue clears | ☐ |

---

## Test 5: App Restart with Pending Queue

**Goal:** Verify AsyncStorage persistence survives a full app restart.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 5.1 | Go offline → scan 2 plants | 2 items in queue | ☐ |
| 5.2 | Force-close the app (swipe from recents) | App terminates | ☐ |
| 5.3 | Turn WiFi **ON** while app is closed | Device is now online | ☐ |
| 5.4 | Re-open the app | App loads, and the **sync modal appears immediately** (mount-time check) with "2 offline scans" | ☐ |
| 5.5 | Tap "Sync Now" | Uploads succeed, queue clears | ☐ |

---

## Test 6: Online Upload Failure → Fallback to Queue

**Goal:** Verify graceful fallback when server is unreachable.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 6.1 | **Stop the Express server** (`Ctrl+C` in the server terminal) | Server is down | ☐ |
| 6.2 | Keep device WiFi **ON** (device thinks it's online) | — | ☐ |
| 6.3 | Open Scan tab and scan a plant | AI result appears | ☐ |
| 6.4 | Check the status banner | Shows **"⚠️ Upload failed — saved offline"** (Axios error caught, fallback to queue) | ☐ |
| 6.5 | **Restart the Express server** (`npm run dev`) | Server is back | ☐ |
| 6.6 | Toggle airplane mode OFF→ON→OFF (force a reconnect) | Sync modal appears with 1 pending scan | ☐ |
| 6.7 | Tap "Sync Now" | Upload succeeds this time | ☐ |

---

## Test 7: Sync Interrupted Mid-Upload

**Goal:** Verify partial failure handling (network dies during sync).

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 7.1 | With `adb reverse` active, go offline → scan 3 plants → go online | Sync modal appears | ☐ |
| 7.2 | Tap "Sync Now" | Upload starts ("Uploading batch 1...") | ☐ |
| 7.3 | **Immediately run `adb reverse --remove tcp:3000`** in terminal | Connection is severed mid-upload | ☐ |
| 7.4 | Wait up to 20 seconds for the timeout | Shows **"Sync Interrupted"** alert with message about trying again later | ☐ |
| 7.5 | Modal dismisses automatically | — | ☐ |
| 7.6 | Run `adb reverse tcp:3000 tcp:3000`, then toggle Airplane Mode | Sync modal reappears with remaining items | ☐ |
| 7.7 | Tap "Sync Now" again | Remaining scans upload successfully | ☐ |

---

## Test 8: Large Batch (>10 items, Chunking)

**Goal:** Verify the 10-per-batch chunking works for multer's limit.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 8.1 | Go offline | — | ☐ |
| 8.2 | Scan **12 plants** one by one | All 12 show "📱 Saved offline" | ☐ |
| 8.3 | Go online | Sync modal shows "12 offline scans" | ☐ |
| 8.4 | Tap "Sync Now" | Progress shows "Uploading 1 to 10 of 12..." then "Uploading 11 to 12 of 12..." | ☐ |
| 8.5 | Check Cloudinary + Firestore | All 12 images uploaded, 12 documents created | ☐ |

---

## Test 9: Auth Guard

**Goal:** Verify the sync modal never appears for unauthenticated users.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 9.1 | Log out of the app | Redirected to login screen | ☐ |
| 9.2 | Toggle airplane mode OFF → ON → OFF | No sync modal appears (guarded by `user && user.emailVerified`) | ☐ |

---

## Test 10: Max Retry Limit

**Goal:** Verify that scans with 3+ failures stop being retried.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 10.1 | Go offline → scan 1 plant → go online (server OFF) | Sync modal appears | ☐ |
| 10.2 | Tap "Sync Now" → fails (server is down) | `retryCount` increments to 1 | ☐ |
| 10.3 | Trigger reconnect again → Sync Now → fails | `retryCount` = 2 | ☐ |
| 10.4 | Trigger reconnect again → Sync Now → fails | `retryCount` = 3 | ☐ |
| 10.5 | Trigger reconnect a 4th time | **Sync modal does NOT appear** (item filtered out by `retryCount < 3`) | ☐ |

---

> [!TIP]
> **Quick way to toggle offline on Android:** Pull down the notification shade and tap the Airplane Mode icon. This is faster than going into Settings.

> [!WARNING]
> **Test on a real device.** Android emulators sometimes don't accurately simulate network transitions, which can cause the `useNetworkStore` offline→online detection to behave differently than on real hardware.
