# Phase 6 Implementation Plan: Home Tab & Advanced History Controls

## 1. Overview
Phase 6 serves as the final feature polish for the application before release. It introduces the primary landing dashboard (Home Tab) and empowers users with full control over their scan history, including the ability to delete scans, mark them as favorites, and filter their history.

## 2. Architectural Rules & Data Flow
Following the strict **Hybrid Online-Offline Three-Tier Architecture**:
*   **Reads:** The Home tab and History filters will read directly from Firestore via the Firebase JS SDK on the client.
*   **Writes (Deletions & Edits):** All mutating actions (deleting a scan, toggling a favorite) **must** go through the Express backend via authenticated Axios requests.

---

## 3. Implementation Steps

### Step 1: Backend API Additions (`hanap-medisina-server`)
The backend needs to support the new mutating actions securely.

#### A. Controller Logic (`src/controllers/scan.controller.js`)
1.  **`deleteScan`:** 
    *   Verify the scan belongs to `req.user.uid`.
    *   Delete the document from Firestore (`users/{uid}/scans/{scanId}`).
    *   *(Optional but recommended)* Extract the Cloudinary `public_id` from the URL and delete the image from Cloudinary to save space.
2.  **`toggleFavorite`:**
    *   Verify ownership.
    *   Update the `isFavorite` boolean field on the Firestore document.

#### B. Route Definitions (`src/routes/scan.routes.js`)
1.  Add `DELETE /:id` bound to `deleteScan`.
2.  Add `PATCH /:id/favorite` bound to `toggleFavorite`.

---

### Step 2: History Tab Upgrades (`hanap-medisina-mobile`)
Enhance the existing History tab to support the new features.

#### A. Firebase Service Updates (`src/services/firebaseHistory.ts`)
1.  Update `getPaginatedUserScans` to accept optional filter parameters (e.g., `filterBy: 'all' | 'favorites'`).
2.  If filtering by favorites, adjust the Firestore query to include `where("isFavorite", "==", true)`.

#### B. UI Components (`src/components/history/`)
1.  **Filter Bar:** Add a horizontal scroll view with filter chips ("All", "Favorites", "Last 7 Days") at the top of `index.tsx`.
2.  **Scan Detail Sheet:** 
    *   Add a ❤️ (Heart) icon button to the header to toggle the favorite status.
    *   Add a 🗑️ (Trash) icon button to permanently delete the scan.
    *   Implement optimistic UI updates (update local state immediately while the Axios request processes in the background).

---

### Step 3: The Home Tab (`app/(tabs)/index.tsx`)
Create a welcoming and dynamic dashboard for the user.

1.  **Welcome Header:** Display a personalized greeting ("Good morning, [Name]!").
2.  **Quick Actions:** Large, prominent buttons to jump straight to Scanning or the Plant Library.
3.  **Recent Favorites Carousel:** Fetch the 5 most recent scans where `isFavorite == true` and display them in a visually appealing horizontal carousel.
4.  **Daily Tip / Did You Know:** A small static or randomized card showing a quick fact about Philippine medicinal plants to increase engagement.
