# Project Handoff Notes

Working notes for picking up backend ↔ frontend integration. Current state captured **2026-04-29**.

---

## Project overview

Construction material inventory management app.

- **Frontend**: React Native + Expo (TypeScript), in the project root (`App.tsx`, `src/`).
- **Backend**: Express + PostgreSQL (TypeScript), in `backend/`.
- **Auth**: JWT, bcrypt-hashed passwords, four permission levels (1=Admin, 2=ProjectManager, 3=Logistics, 4=Foreman — lower number = higher privilege).

### Layout

```
.
├── App.tsx                          # nav stack root
├── package.json                     # Expo app
├── src/
│   ├── api/
│   │   └── auth.ts                  # only API module written so far (login)
│   ├── data/mockData.ts             # placeholder data — DELETE once API is wired
│   ├── screens/                     # 6 screens, all built but using mockData
│   │   ├── Login.tsx                # cosmetic — does NOT call login() yet
│   │   ├── MainMenu.tsx
│   │   ├── jobSites.tsx
│   │   ├── Payorders.tsx
│   │   ├── Warehouses.tsx
│   │   └── WarehouseDeliveries.tsx
│   ├── types/index.ts               # camelCase domain types
│   ├── components/placeholder       # empty
│   ├── context/placeholder          # empty — AuthContext goes here
│   └── navigation/placeholder       # empty
└── backend/
    ├── .env                         # filled in (Postgres password + JWT secret)
    ├── .env.example
    ├── schema.sql                   # full schema + seeded admin user
    ├── package.json                 # deps installed
    └── src/
        ├── server.ts
        ├── config/db.ts             # pg Pool
        ├── middleware/auth.ts       # requireAuth, requirePermission, PERMISSIONS
        ├── routes/                  # auth, jobsites, payorders, warehouses
        └── controllers/             # one per route file
```

### Default seeded admin (from `schema.sql`)

- email: `admin@coolsys.com`
- password: `Admin1234`

---

## Current state — what's done

### Backend (mostly built)

- Express server (`server.ts`) with CORS + JSON middleware, mounting four route files.
- Auth: `POST /auth/login`, `GET /auth/me`, plus admin-only `POST /auth/register`, `GET /auth/users`, `DELETE /auth/users/:email`, `PATCH /auth/users/:email/permission`.
- Jobsites: full CRUD + nested inventory endpoints (materials/equipment/tools).
- Warehouses: full CRUD + nested deliveries.
- Payorders: full CRUD + nested inventory.
- JWT middleware enforces auth + permission-level gates per route.
- `db.ts` reads from `.env`, logs `✅ Connected to PostgreSQL` on success.

### Frontend (UI shell only)

- Navigation stack wired in `App.tsx` (Login → MainMenu → 4 list screens).
- All six screens render correctly with `StyleSheet`-based styling.
- `src/api/auth.ts` has a working `login()` function — but **it's never imported**. `Login.tsx`'s button just navigates to `MainMenu` without reading inputs or calling the API.

### Recent fixes (just landed)

In `backend/src/controllers/payordersController.ts`:

1. `getPayorders` now JOINs `jobsites` so the response includes `jobsite_name` and `jobsite_address`; ordering uses real columns.
2. `createPayorder` takes `jobsiteId` (matching the FK in `schema.sql`), validates the jobsite exists with a 404, and inserts into `jobsite_id`. Previously it tried to insert into a non-existent `jobsite_address` column.
3. `getPayorderInventory` reads `req.params.id` (the route is `/:id/inventory`); it was reading `req.params.payorderId` and always getting undefined.

In `backend/src/controllers/authController.ts` and `backend/src/routes/auth.ts`:

4. New `GET /auth/me` endpoint — returns `{ email, role, permissionLevel }` from the decoded JWT for any logged-in user. Registered in `routes/auth.ts` between `login` and the admin gate so it doesn't require admin permission.

`tsc --noEmit` in `backend/` passes clean.

---

## Known gaps still open

### Backend

- **No smoke test run yet.** Postgres needs to be running locally, schema needs to be applied, then `npm run dev` and curl-verify `/auth/login` + `/auth/me`. See "Resume here" below.
- **Warehouses model is thinner than `src/types/index.ts` expects.** Schema has `id` + `warehouse_address` only; frontend `Warehouse` type expects `warehouseName` + `warehouseId`. Need to pick one and align both sides.
- **`requireAuth` returns a vague `'Something went wrong'`** when the Authorization header is missing. Should be `'Missing or invalid Authorization header'`.

### Frontend

- `Login.tsx` is cosmetic (no `useState`, never calls `login()`, never stores the token).
- No token storage. Need `expo-secure-store` (sensitive) or `@react-native-async-storage/async-storage`.
- No `AuthContext`. `src/context/placeholder` is empty.
- No API client wrapper. `auth.ts` hardcodes `http://localhost:3000` and uses raw `fetch`. Need `src/api/client.ts` that auto-attaches `Authorization: Bearer <token>` and centralizes error handling (401 → logout).
- **`localhost` won't work from a physical phone.** Need to use the dev machine's LAN IP or an Expo tunnel.
- Missing API modules: `src/api/jobsites.ts`, `warehouses.ts`, `payorders.ts`.
- Every list screen still imports from `src/data/mockData.ts`.
- Add/Delete buttons render but have no `onPress` handlers.
- No inventory detail screens — the backend has `/jobsites/:id/inventory`, `/warehouses/:id/deliveries/:id/inventory`, etc., but there's no UI for materials/equipment/tools yet.
- MainMenu's Logout/Admin buttons are dead. Logout should clear the token; Admin should route to a (not-yet-built) user management screen visible only when `permissionLevel === 1`.

### Cross-cutting type mismatch

Three different shapes for the same entities:

- **Backend** returns snake_case from `pg` rows directly (`jobsite_name`, `jobsite_address`).
- **`src/types/index.ts`** defines camelCase (`jobsiteName`, `jobsiteAddress`) with nested `inventory`.
- **`src/data/mockData.ts`** defines its own minimal `{ id, address }` shape that matches neither.

**Plan**: alias columns in SQL `SELECT`s on the backend (`SELECT id, jobsite_name AS "jobsiteName", jobsite_address AS "jobsiteAddress"`) so responses match `src/types/index.ts`, then delete `mockData.ts` once everything reads from the API.

---

## Order of attack

1. ✅ Fix the two `payordersController.ts` bugs.
2. 🟡 Add `/auth/me`, run Postgres setup + smoke tests. **Code is done; smoke tests are pending — see "Resume here".**
3. ⬜ Frontend auth wiring: install `expo-secure-store`, create `AuthContext`, build `src/api/client.ts`, rewrite `Login.tsx` to call `login()` and persist the token.
4. ⬜ Restructure `App.tsx` to swap between an auth stack and a main stack based on auth state.
5. ⬜ Build `src/api/jobsites.ts`, `warehouses.ts`, `payorders.ts`. Convert `src/screens/jobSites.tsx` end-to-end as a template (loading + error states, `useFocusEffect` to fetch, `RefreshControl`).
6. ⬜ Repeat for the other list screens, wire Add/Delete flows (modal forms + confirm dialogs), then build inventory detail screens.

---

## Resume here (next concrete actions)

### Finish step 2 — local Postgres smoke test

1. Make sure Postgres is running on port 5432, then create the DB:

   ```
   psql -U postgres -c "CREATE DATABASE construction_inventory;"
   ```

2. Apply schema (also seeds the admin user):

   ```
   psql -U postgres -d construction_inventory -f backend/schema.sql
   ```

3. Start the backend:

   ```
   cd backend
   npm run dev
   ```

   Expect: `✅ Connected to PostgreSQL` then `Backend running on http://localhost:3000`.

4. Smoke test from another terminal:

   ```
   curl http://localhost:3000/health

   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@coolsys.com","password":"Admin1234"}'

   # paste the token from above into the next call:
   curl http://localhost:3000/auth/me \
     -H "Authorization: Bearer <paste-token-here>"
   ```

   `/auth/me` should return `{"email":"admin@coolsys.com","role":"Admin","permissionLevel":1}`.

### Then start step 3 — frontend auth wiring

Rough sketch of what to build:

- Install: `npx expo install expo-secure-store`
- `src/api/client.ts` — wrapper around `fetch` that:
  - Reads `BASE_URL` from a config (and uses LAN IP, not `localhost`, for physical-device testing)
  - Pulls the token from `SecureStore` and sets `Authorization: Bearer <token>`
  - On 401, clears the token and routes to Login
- `src/context/AuthContext.tsx` — exposes `{ user, token, login, logout, loading }`. On mount, reads the saved token and calls `/auth/me` to validate it before showing the main stack.
- Rewrite `Login.tsx`: `useState` for email/password, call `login()` from `src/api/auth.ts` on submit, store the token via the context, surface errors inline.
- Rewrite `App.tsx`: wrap `<NavigationContainer>` with `<AuthProvider>`, conditionally render an "auth stack" (just Login) vs. a "main stack" (everything else) based on `token`.

---

## Useful commands

```
# Backend
cd backend
npm run dev                                     # ts-node-dev with hot reload
npx tsc --noEmit                                # type-check without emitting
psql -U postgres -d construction_inventory      # interactive SQL

# Frontend (from project root)
npm start                                       # expo start
npm run android
npm run ios
```

---

## Files most likely to be edited next

- `src/screens/Login.tsx` — wire up the form
- `src/api/auth.ts` — already correct, but `BASE_URL` will move to a config
- `src/api/client.ts` — to be created
- `src/context/AuthContext.tsx` — to be created
- `App.tsx` — split into auth vs. main stacks
