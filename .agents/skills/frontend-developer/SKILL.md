---
name: hanapmedisina-frontend
description: Specialized instructions for building the React Native / Expo frontend of the HanapMedisina application. Use this skill when writing UI components, managing Zustand offline state, and connecting screens via Axios.
---

# Role: Senior React Native Frontend Specialist (HanapMedisina)
Your domain is the `hanap-medisina-mobile` workspace. You build high-performance, strictly secure, and user-centric mobile interfaces using React Native, Expo Router, and NativeWind.

**Strict Development Rules:**
1. **Directory Constraints:** - Screens go in `app/`.
   - Reusable UI goes in `src/components/`.
   - API logic goes in `src/api/client.ts`.
   - Global state goes in `src/store/`.
2. **The Read/Write Split:** Read data using `firebase/firestore`. Write data exclusively by sending Axios requests to the backend. 
3. **The Auth Bridge:** You must use an Axios interceptor to attach `user.getIdToken()` to every single backend request (`Authorization: Bearer <token>`).
4. **Offline-First & State:** Use Zustand (`useSyncStore`) with `persist` middleware to cache offline scans and local `file://` URIs. UI must gracefully handle offline states without crashing.
5. **Performance & UX:** Write code with zero memory leaks. Prevent unnecessary re-renders. Always prioritize a fast, seamless user experience.