# Phase 2: Login & Authentication Code Review

**Reviewer:** `hanapmedisina-qa` (DevSecOps & QA Auditor)
**Focus:** Race conditions, offline sync failures, rate limiting vulnerabilities, and memory leaks.
**Status:** ⚠️ Needs Attention (Changes required before production)

I have aggressively audited the generated code for Phase 2 (Authentication) across both the React Native frontend and the Express.js backend. While the baseline functionality is sound, there are critical vulnerabilities regarding offline behavior, performance overhead, and backend security that must be addressed.

Here are the findings organized by severity.

---

### 🚨 Critical Severity

#### 1. Token Refresh Bomb (Frontend API Client)
**File:** `hanap-medisina-mobile/src/api/client.ts`
**Issue:** The Axios request interceptor forces a token refresh on *every single API request*.
```typescript
// Line 16 in client.ts
const token = await user.getIdToken(true); // `true` forces an immediate network refresh
```
**Impact:** This completely breaks the purpose of JWTs. It adds significant latency (a full network roundtrip to Firebase Auth) to every single backend call. Under heavy usage or poor connectivity, this will cause extreme slow-downs and likely trigger Firebase Auth rate limits, resulting in temporary bans.
**Recommendation:** Remove the `true` argument. `user.getIdToken()` automatically returns a cached token and only performs a network refresh if the token is close to expiring.
```typescript
const token = await user.getIdToken();
```

#### 2. Orphaned Accounts on Network Drop (Offline Sync Failure)
**File:** `hanap-medisina-mobile/src/store/useAuthStore.ts` (Lines 56-69)
**Issue:** In `registerWithEmail`, if the backend profile creation fails, the code attempts to clean up by deleting the Firebase Auth user. 
```typescript
} catch (backendError) {
    await cred.user.delete(); // <--- Fails if offline
    throw new Error("Failed to save profile to database. Please try again.");
}
```
**Impact:** If the user loses network connection immediately after the Firebase Auth account is created (Step 1), the Express backend request (Step 3) will fail. The `catch` block will run, but `cred.user.delete()` **also requires a network connection**. It will throw an unhandled exception. 
The result: An orphaned Firebase Auth account exists with no corresponding Firestore profile. If the user tries to register again, they get an "Email already in use" error, but they can't properly log in because their profile is missing.
**Recommendation:** 
- Instead of attempting to delete the account and assuming perfect connectivity, use the `useSyncStore` to queue the profile creation if the network is down.
- Alternatively, modify the login flow to check if a Firestore profile exists upon login, and if not, prompt the user to complete their profile then.

---

### ⚠️ High Severity

#### 3. Unhandled Profile Missing on Google Sign-In
**File:** `hanap-medisina-mobile/src/store/useAuthStore.ts` (Lines 103-108)
**Issue:** During `loginWithGoogle`, the code makes a backend handshake to create a profile. If this request fails (e.g., network error), an exception is thrown, but the user is already logged into Firebase.
**Impact:** The user gets stuck in a state where they are authenticated with Firebase but the Express backend never created their `users` document in Firestore.
**Recommendation:** Similar to the email registration issue, wrap the profile creation in an offline-capable queue or implement a "sync check" on the splash screen that ensures the user document exists before letting them into the main app.

#### 4. Missing API Rate Limiting (Backend Hardening)
**File:** `hanap-medisina-server/src/routes/user.routes.js`
**Issue:** The `/profile` POST route is exposed without any rate limiting.
**Impact:** A malicious actor with valid (or automated) Firebase tokens could spam the `/profile` endpoint, driving up Firestore read/write costs (Denial of Wallet attack).
**Recommendation:** Implement `express-rate-limit` middleware on auth-related routes to restrict the number of requests per IP.

---

### 🟡 Medium Severity

#### 5. Insufficient Payload Validation
**File:** `hanap-medisina-server/src/controllers/user.controller.js`
**Issue:** The controller only checks `if (!firstName)` but lacks strict type or length validation.
```javascript
const { firstName, lastName, username } = req.body;
```
**Impact:** Clients can bypass frontend validation and send strings that are megabytes in size for `lastName` or `username`. This consumes excessive Firestore storage limits.
**Recommendation:** Implement a validation library like `Joi` or `Zod` in the Express backend to enforce strict maximum lengths (e.g., 50 characters for names) and sanitize strings before saving them to Firestore.

#### 6. Generic Error Re-throwing
**File:** `hanap-medisina-mobile/src/store/useAuthStore.ts`
**Issue:** The catch blocks in `loginWithEmail` and `registerWithEmail` simply do `throw error`.
**Impact:** While the UI catches this, throwing raw errors from the store can sometimes lead to unhandled promise rejections if the UI component unmounts before the promise resolves.
**Recommendation:** Return custom Error objects or specific status objects from the store rather than re-throwing raw Firebase errors.

---

### Summary
The foundation is solid, but the network transitions need to be hardened to respect the offline-first architecture of HanapMedisina. The **Token Refresh Bomb** must be fixed immediately as it is a severe performance issue. 

Please let me know when you are ready to begin refactoring these issues.
