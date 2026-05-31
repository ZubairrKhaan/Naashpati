# Run Full Stack Without Upgrading Hostinger Plan

You can keep Hostinger Premium for frontend and host the backend for free elsewhere.

## Architecture

- Frontend: Hostinger Premium (static files from `dist`)
- Backend API: free Node host (Render free web service)
- Database: MongoDB Atlas

This avoids the Hostinger Node.js plan requirement.

## 1. Deploy Backend for Free (Render)

1. Push your repository to GitHub.
2. In Render, create a new **Web Service** from your repo.
3. Use these settings:
   - Root directory: `backend`
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables from `backend/.env.production`.
5. Set these required values at minimum:
   - `NODE_ENV=production`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `JWT_REFRESH_SECRET=...`
   - `CLIENT_URLS=https://naashpati.com,https://www.naashpati.com`
   - `CLIENT_URL=https://naashpati.com`
   - `FRONTEND_URL=https://naashpati.com`
6. Deploy and copy backend URL, for example:
   - `https://naashpati-api.onrender.com`

## 2. Point Frontend to Free Backend

Edit [/.env.production](.env.production) and set:

- `VITE_API_URL=https://YOUR-RENDER-BACKEND/api`
- `VITE_APP_URL=https://naashpati.com`

Example:

- `VITE_API_URL=https://naashpati-api.onrender.com/api`

## 3. Build Frontend Again

From project root:

- `npm run build`

Upload `dist` output to Hostinger website files.

## 4. Verify

1. Open backend health URL:
   - `https://YOUR-RENDER-BACKEND/api/health`
2. Open website:
   - `https://naashpati.com`
3. Test register and login.
4. Confirm browser network requests go to Render backend URL, not localhost.

## 5. Important Notes

- Render free tier may sleep when idle. First request can be slow.
- This setup works on Hostinger Premium because backend runs outside Hostinger hosting plan.
- If you later upgrade Hostinger to a Node-capable plan, you can move backend back and set `VITE_API_URL=/api`.
