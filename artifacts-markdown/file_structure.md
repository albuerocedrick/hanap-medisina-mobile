# HanapMedisina File Structure Reference

As the System Architect, I have defined the strict file and directory structure for the entire HanapMedisina ecosystem. This structure enforces separation of concerns and organizes features across Phases 1-6.

All Agent Skills (Frontend, Backend, ML, QA) MUST adhere to these designated paths when creating or modifying files.

---

## 📱 Mobile Workspace (`hanap-medisina-mobile`)

This is the React Native (Expo) frontend application. It relies on Expo Router for file-based routing and a strictly organized `src/` directory for logic.

```text
hanap-medisina-mobile/
├── .agents/                 # AI Agent Skills Definitions
│   └── skills/
├── app/                     # Expo Router Pages
│   ├── (auth)/              # Authentication Flow (Login, Signup, Verify)
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-email.tsx
│   ├── (tabs)/              # Main App Flow
│   │   ├── _layout.tsx      # Bottom Tab Navigator Setup
│   │   ├── index.tsx        # Library Tab (Direct Firestore Reads)
│   │   ├── scan.tsx         # Scan Tab (Vision Camera & TFLite)
│   │   ├── history.tsx      # Unified Scan History List
│   │   ├── history/
│   │   │   └── [id].tsx     # Detailed Scan Result View
│   │   └── profile.tsx      # User Dashboard & Stats
│   ├── _layout.tsx          # Root Layout (Auth Guard & Global Modals)
│   └── +not-found.tsx
├── src/                     # Core Application Logic
│   ├── api/
│   │   └── client.ts        # Axios instance with Firebase Token Interceptor
│   ├── components/          # Reusable NativeWind UI Components
│   │   ├── library/         # Plant cards, filter pills, search bars
│   │   ├── plant-details/   # Details, Research, Compare sub-tabs
│   │   └── global/          # SyncPromptModal.tsx, buttons, etc.
│   ├── hooks/               # Custom React Hooks
│   │   └── useNetworkSync.ts# Network monitoring logic (@react-native-community/netinfo)
│   ├── services/            # Third-Party Integrations
│   │   ├── firebase.ts      # Firebase App, Auth, and Firestore init
│   │   └── tflite.ts        # Helper functions for the native ML model
│   ├── store/               # Global State (Zustand)
│   │   ├── useAuthStore.ts  # Current user session
│   │   ├── useLibraryStore.ts # Caching library filters/search
│   │   └── useSyncStore.ts  # AsyncStorage-persisted offline scan queue
│   └── types/               # TypeScript Interfaces
│       └── index.ts         # User, Scan, Plant type definitions
├── assets/                  # Local Images and Fonts
├── android/                 # Generated Native Android Code (Avoid manual edits)
├── ios/                     # Generated Native iOS Code (Avoid manual edits)
├── global.css               # NativeWind base styles
├── tailwind.config.js       # NativeWind theme/token configuration
├── app.json                 # Expo Configuration
├── eas.json                 # EAS Build configurations (Phase 6)
├── .env                     # Local environment variables
└── .env.production          # Production environment variables (Phase 6)
```

---

## 🖥️ Server Workspace (`hanap-medisina-server`)

This is the secure Express.js Node API. It acts as the gatekeeper for all write operations and handles heavy media lifting via Cloudinary and Multer.

```text
hanap-medisina-server/
├── index.js                 # Express Application Entry Point (Middleware, Routes, Port)
├── serviceAccountKey.json   # Secret Firebase Admin SDK Credentials (DO NOT COMMIT)
├── .env                     # Environment Variables (Port, Cloudinary Keys)
├── package.json             # Dependencies (express, firebase-admin, multer, cloudinary)
└── src/                     # Core Backend Logic
    ├── config/              # Centralized Configuration
    │   └── firebase.js      # Firebase Admin SDK initialization helper
    ├── controllers/         # Request Handlers (Business Logic)
    │   ├── scan.controller.js    # Parses form-data, calls Cloudinary, writes to Firestore
    │   ├── profile.controller.js # Handles avatar uploads and Auth profile updates
    │   └── user.controller.js    # General user management logic
    ├── middleware/          # Request Interceptors
    │   ├── authMiddleware.js     # verifyToken (decodes Firebase ID token)
    │   └── uploadMiddleware.js   # Multer configurations (if abstracted from routes)
    ├── routes/              # Express Endpoint Definitions
    │   ├── scan.routes.js        # POST /api/scans/sync
    │   ├── profile.routes.js     # POST /api/profile/avatar
    │   └── user.routes.js        # User-specific endpoints
    └── services/            # Third-Party API Wrappers
        └── cloudinaryService.js  # Stream uploader for image buffers
```

### Architectural Enforcement Reminders for Agents:
- **Frontend Agents:** Do not create direct database write logic in `src/services/`. All writes MUST be formatted as Axios requests in `src/api/` or directly inside the component/store calling the endpoint.
- **Backend Agents:** Do not create UI or frontend-specific logic. Your job is strictly to receive, validate, sanitize, and persist data in `src/controllers/` using the `firebase-admin` tools.
- **ML Native Agents:** Ensure your `.tflite` model files are properly linked in the `assets/` or `android/app/src/main/assets/` folders as required by `react-native-fast-tflite`.
