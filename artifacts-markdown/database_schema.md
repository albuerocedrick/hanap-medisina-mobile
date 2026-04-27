# HanapMedisina: Firestore Database Schema

This document defines the strict NoSQL data structures for the HanapMedisina Firebase Firestore database. It is designed to fully support the **Hybrid Online-Offline Architecture** and adheres to the **Read/Write Split Rule** (Frontend reads directly, Backend handles writes securely).

---

## 1. `users` Collection
Stores user profile information. Managed via Firebase Auth, but extended here for application-specific metadata.

*   **Document ID:** `uid` (Matches Firebase Authentication UID)
*   **Permissions:** 
    *   **Read:** Frontend (Client SDK) - Only the authenticated user can read their own doc.
    *   **Write:** Backend (Admin SDK) via `/api/profile/avatar` and auth triggers.
*   **Fields:**
    ```typescript
    {
      uid: string;
      email: string;
      displayName: string | null;
      photoURL: string | null;     // Hosted on Cloudinary (Updated by Backend)
      createdAt: timestamp;        // Server timestamp
      lastLogin: timestamp;
    }
    ```

---

## 2. `scans` Collection
Records the history of plants scanned by the user's on-device TFLite model.

*   **Document ID:** Auto-generated ID (or Frontend generated UUID passed to Backend)
*   **Permissions:**
    *   **Read:** Frontend (Client SDK) - Real-time querying (`where userId == currentUid` ordered by `timestamp`).
    *   **Write:** Backend (Admin SDK) via `/api/scans/sync`.
*   **Fields:**
    ```typescript
    {
      id: string;
      userId: string;              // Indexed: Foreign key to users collection
      plantName: string;           // e.g., "Oregano"
      confidence: number;          // Float between 0.0 and 1.0 (e.g., 0.95)
      imageUrl: string;            // Hosted on Cloudinary (Uploaded by Backend during sync)
      timestamp: timestamp;        // The exact time the scan occurred on the device (Offline friendly)
      syncedAt: timestamp;         // Server timestamp when the backend successfully processed the write
    }
    ```

---

## 3. `plants` Collection (The Library)
The global database of medicinal plants. This is a highly read-heavy collection powering the Library tab, Details, Research, and Compare features.

*   **Document ID:** Unique Plant Slug (e.g., `sambong`, `lagundi`)
*   **Permissions:**
    *   **Read:** Frontend (Client SDK) - Public/Authenticated read access for library browsing and searching.
    *   **Write:** Backend/Admin Only (App users do NOT write to this collection).
*   **Fields:**
    ```typescript
    {
      id: string;
      localName: string;           // "Sambong"
      scientificName: string;      // "Blumea balsamifera"
      imageUrl: string;            // Hosted on Cloudinary
      tags: string[];              // For the Search Bar / Filter Pills (e.g., ["cough", "leaves"])
      
      // Sub-tab 1: Details
      details: {
        preparationMethods: string[];
        identificationFacts: string[]; // e.g., "5-pointed leaves", "fuzzy texture"
        warnings: string[];
      };

      // Sub-tab 2: Research
      research: {
        summary: string;
        references: string[];      // URLs or citations
      };

      // Sub-tab 3: Compare
      lookAlikes: string[];        // Array of Plant IDs that share visual similarities
    }
    ```

---

## 4. `favorites` Collection
Stores plants that the user has intentionally saved for quick access. 
*Note: While favorites are stored locally via `AsyncStorage` for offline restriction-free viewing, backing them up to Firestore ensures cross-device persistence.*

*   **Document ID:** Auto-generated ID
*   **Permissions:**
    *   **Read:** Frontend (Client SDK) - `where userId == currentUid`.
    *   **Write:** Backend (Admin SDK) via `/api/favorites/toggle` (or Frontend write if strictly permitted by security rules, though routing through backend maintains strict split).
*   **Fields:**
    ```typescript
    {
      id: string;
      userId: string;              // Indexed: Foreign key to users
      plantId: string;             // Indexed: Foreign key to plants collection
      savedAt: timestamp;
    }
    ```

---

## Alignment Verification Checklist

- [x] **Frontend Reads Supported?** Yes. All user-specific queries (`scans`, `favorites`) rely on `userId` indexing for fast Firestore client SDK retrieval.
- [x] **Backend Writes Enforced?** Yes. Fields like `imageUrl` strictly expect Cloudinary URLs generated exclusively by the Express backend's Multer pipeline.
- [x] **Offline Compatible?** Yes. The `scans` schema inherently respects the difference between the actual scan `timestamp` (captured offline) and the `syncedAt` server timestamp.
