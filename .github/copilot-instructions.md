## Purpose

This file gives concise, repo-specific guidance for AI coding agents working on InsuBuddy (a Vite + React + Capacitor app using Firebase). Focus on the files and patterns below when making changes.

**Big Picture**
- **Frontend**: React (Vite) single-page app in `src/` served by `npm run dev` and built with `npm run build`.
- **Auth & Data**: Firebase Authentication + Firestore are used for users, settings and primary data.
- **Native wrapper**: Capacitor is used for native mobile packaging; native project lives under `android/` and config in `capacitor.config.ts` / `capacitor.config.json`.

**Important Build / Dev commands**
- Start dev server: `npm run dev` (Vite). See `package.json`.
- Build production web bundle: `npm run build`.
- Capacitor native flow (Android): build web first, then sync and open native project:

  1. `npm run build`
  2. `npx cap sync android`
  3. `npx cap open android` (open in Android Studio / run emulator)

Note: This repo does not include test scripts or CI config; run the Vite dev server locally for most iterative work.

**Key files & locations (quick map)**n
- Firebase initialization: [src/firebase.js](src/firebase.js) — update here when changing Firebase project settings.
- Auth wrapper: [src/context/AuthContext.jsx](src/context/AuthContext.jsx) — centralizes Firebase Auth flows (signup, login, logout, Google, email verification).
- Main router: [src/App.jsx](src/App.jsx) — routes and `ProtectedRoute` usage.
- Dashboard + UI: [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx) — large, single-file UI, translations and many UX flows live here.
- Data services: [src/services/policyservice.jsx](src/services/policyservice.jsx), [src/services/valuableItemsService.js](src/services/valuableItemsService.js), [src/services/notificationService.js](src/services/notificationService.js) — encapsulate Firestore read/write and client-side transforms.
- Capacitor config: [capacitor.config.ts](capacitor.config.ts) and [capacitor.config.json](capacitor.config.json).
- Native Android: `android/` — platform-specific build files and AndroidManifest.

**Project-specific patterns and gotchas**
- File storage: policies and item images are stored as Base64 blobs inside Firestore documents (see `policyservice.jsx` and `valuableItemsService.js`). Do NOT assume files are uploaded to Firebase Storage; the code encodes/decodes in-service.
- Client-side image compression: `valuableItemsService.js` compresses images via canvas toDataURL before writing to Firestore — respect quality/size tradeoffs when changing this logic.
- In-component i18n: `Dashboard.jsx` contains a `translations` object (de/en) inside the component — translations are not centralized. If you extract strings, update the component accordingly.
- Admin flagging: `useAdmin()` checks the `admins` collection in Firestore — admin UX depends on that collection.
- Services shape: service functions expect `userId` passed explicitly (e.g., `addPolicy(currentUser.uid, ...)`) — keep that contract when refactoring.

**Firestore collections observed**
- `policies` — store policy documents (contains `file` as Base64), createdAt/updatedAt.
- `valuableItems` — store user items with compressed `image.data` (Base64).
- `userSettings` — stores notification settings (see `notificationService.js`).
- `partnerInsurances` — public partner offers (queried with `status == 'published'`).
- `admins` — used by `useAdmin` hook to determine admin users.

**Quick examples to reference**
- To add a policy (serverless flow): call `addPolicy(userId, policyData, file)` from `src/services/policyservice.jsx` — the service converts `file` to Base64 and writes a Firestore document.
- To compute notification reminders: see `checkExpiringPolicies(policies, reminderDays)` in `src/services/notificationService.js`.

**When you modify backend/data code**
- Preserve document shape (fields like `file.data`, `image.data`, `createdAt`, `userId`) unless you also migrate existing documents. Changes to shape require a migration strategy.

**Debugging tips**
- Auth state logs: `AuthContext.jsx` contains helpful console logging for signup flow — use it while debugging authentication.
- Use the Vite dev server for fast iteration; hot reload is enabled.
- When testing native features (camera, capacitor plugins), build the web bundle first and sync with Capacitor before running on an emulator/device.

**Security & secrets**
- `src/firebase.js` contains the Firebase web config (project identifiers) required for the frontend; these are public client keys. Do not commit server private keys to the repo.

If something important is missing or you'd like more detail (e.g., expected Firestore document examples, specific migration steps, or CI instructions), tell me which area to expand.
