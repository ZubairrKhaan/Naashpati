# Hostinger Deployment Checklist (naashpati.com)

Use this checklist to deploy without startup crashes and without API routing issues.

## 1. Backend App (Node.js)

1. Upload the `backend` folder to your Hostinger Node app path.
2. In Hostinger Node settings:
   - Node version: 18+ (20+ recommended)
   - App mode: production
   - Startup file: `server.js`
3. Install dependencies in backend directory:
   - `npm install --omit=dev`
4. Start command:
   - `npm start`
5. Do not start multiple backend instances manually.

## 2. Backend Environment Variables

1. Use `backend/.env.production`.
2. Fill all `replace_with_...` values with real production secrets.
3. Keep these values exactly:
   - `NODE_ENV=production`
   - `CLIENT_URLS=https://naashpati.com,https://www.naashpati.com`
   - `CLIENT_URL=https://naashpati.com`

## 3. Frontend Build

1. Root `.env.production` should contain:
   - `VITE_API_URL=/api`
   - `VITE_APP_URL=https://naashpati.com`
2. Build frontend from project root:
   - `npm run build`
3. Upload contents of `dist` to your frontend hosting root.

## 4. Reverse Proxy (Required)

Because frontend uses `VITE_API_URL=/api`, Hostinger must forward `/api/*` to your Node backend app.

Target behavior:
- Incoming: `https://naashpati.com/api/*`
- Forward to: Node backend app URL/path on Hostinger (same path `/api/*`)

If Hostinger panel uses path rules, create:
- Rule: `/api/(.*)`
- Upstream: your backend app
- Forward path: `/api/$1`

## 5. Post-Deploy Verification

1. Open: `https://naashpati.com/api/health`
   - Expect JSON: `{"status":"OK","message":"Server is running"}`
2. Test register/login from UI.
3. Check browser Network tab:
   - API requests must go to `https://naashpati.com/api/...`
   - No request should go to `localhost`.

## 6. If You See Failures

- `EADDRINUSE` in logs:
  - More than one backend process is running. Keep only one.
- CORS blocked:
  - Verify `CLIENT_URLS` matches exact domains, including `www` if used.
- Auth/reset links point to localhost:
  - Verify production env is loaded and `CLIENT_URLS`/`CLIENT_URL` are set as above.