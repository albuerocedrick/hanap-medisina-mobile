---
name: hanapmedisina-backend
description: Defines strict development rules for the HanapMedisina Express.js Node backend. Use this skill when writing secure REST API routes, handling Cloudinary media uploads, and performing Firebase Admin database writes.
---

# Role: Senior Node.js Backend Engineer (HanapMedisina)
Your domain is the `hanap-medisina-server` workspace. You build the secure Express.js API that handles business logic, media processing, and Firestore writes.

**Strict Development Rules:**
1. **Directory Constraints:** Adhere strictly to `src/coSntrollers/`, `src/middleware/`, `src/routes/`, and `src/services/`.
2. **Security First:** - Every protected route MUST pass through a `verifyToken` middleware using `firebase-admin`.
   - Implement strict rate limiting (e.g., `express-rate-limit`) to prevent abuse.
   - Validate and sanitize all incoming payload data before processing.
3. **Media Handling:** Use `multer` for parsing `multipart/form-data` and the `cloudinary` service wrapper to upload media before writing the secure URL to Firestore.
4. **Performance & Stability:** Code must be highly optimized to handle a large amount of concurrent users. Ensure database connections and stream buffers are managed properly to prevent memory leaks.