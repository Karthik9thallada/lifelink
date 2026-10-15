# 🚀 LifeLink Deployment Guide (Render + Vercel)

This guide walks you through deploying **LifeLink Backend on Render** and **LifeLink Frontend on Vercel** with full WebSocket and live emergency dispatch support.

---

## 📋 Architecture Overview

- **Backend**: Spring Boot 3.3.5 (Java 21) deployed as a Web Service on **Render** (via Docker or Maven).
- **Frontend**: Vite + React 18 SPA deployed on **Vercel** with client-side routing rewrites (`vercel.json`).
- **Database**: Works out of the box with embedded H2 or can connect to Render PostgreSQL via `SPRING_DATASOURCE_*`.
- **Live Dispatch**: STOMP over WebSocket (`/ws`) connecting directly from Vercel to Render.

---

## Part 1: Push Code to GitHub / GitLab

Vercel and Render deploy directly from a Git repository. If you haven't pushed the repository yet:

```bash
# 1. Stage and commit all changes
git add .
git commit -m "feat: configure cloud deployment for Render and Vercel"

# 2. Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/<YOUR_USERNAME>/lifelink.git

# 3. Push to GitHub
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend on Render

### Option A: 1-Click Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your Git repository.
4. Render will detect `render.yaml` automatically and configure the `lifelink-backend` service.
5. Click **Apply**. Render will build the Docker container and deploy it.

---

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `lifelink-backend` (or your chosen name)
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** (recommended) or **Java**
     - *If Docker*: Dockerfile Path: `Dockerfile` (or `backend/Dockerfile` if Root Directory is left empty).
     - *If Java*: Build Command: `mvn clean package -DskipTests` | Start Command: `java -jar target/lifelink-1.0.0-SNAPSHOT.jar`
   - **Instance Type**: **Free**
4. Under **Advanced** / **Environment Variables**, add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `PORT` | `10000` | (Render default, auto-injected) |
   | `SPRING_PROFILES_ACTIVE` | `prod` | Production Spring profile |
   | `LIFELINK_JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit secret key |
   | `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | Auto-create schema |
5. Set **Health Check Path** to: `/api/health`
6. Click **Create Web Service**.
7. Once deployed, note down your Render backend URL:
   > 📌 Example: `https://lifelink-backend.onrender.com`

---

## Part 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your Git repository (`lifelink`).
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select **`frontend`**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Expand **Environment Variables** and add:
   | Key | Value | Notes |
   |-----|-------|-------|
   | `VITE_API_BASE_URL` | `https://lifelink-backend.onrender.com` | Use your actual Render backend URL |
   | `VITE_WS_BASE_URL` | `wss://lifelink-backend.onrender.com/ws` | (Optional: automatically derived from API URL) |
6. Click **Deploy**.
7. Once finished, Vercel gives you your production URL:
   > 📌 Example: `https://lifelink-frontend.vercel.app`

---

## Part 4: Verification Checklist

1. **Backend Health**:
   Open `https://<YOUR-RENDER-BACKEND>.onrender.com/api/health` in your browser.
   You should see:
   ```json
   {
     "status": "UP",
     "service": "LifeLink Backend"
   }
   ```
2. **Frontend UI & Fast Login**:
   Open `https://<YOUR-VERCEL-FRONTEND>.vercel.app/login`.
   Test the one-click demo login buttons:
   - **Apex Hospital** (`apex@lifelink.org` / `password123`)
   - **Manipal Hospital** (`manipal@lifelink.org` / `password123`)
   - **Rahul (Donor)** (`rahul@lifelink.org` / `password123`)
   - **Sunita (Donor)** (`sunita@lifelink.org` / `password123`)
   - **Vikram (Donor)** (`vikram@lifelink.org` / `password123`)
   - **Administrator** (`admin@lifelink.org` / `admin123`)
3. **Live Dispatch & Real-Time Sync**:
   - Open Hospital in one window and create an emergency request.
   - Open Donor in another window; verify real-time alert via WebSocket.
