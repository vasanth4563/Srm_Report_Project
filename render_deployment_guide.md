# 🚀 How to Deploy Your Project on Render.com

This guide provides step-by-step instructions to deploy your **FastAPI Backend** and **React Frontend** live on [Render.com](https://render.com).

---

## 📁 Files Configured for Deployment

The codebase has already been prepared with the required deployment files:

1. **[`render.yaml`](file:///c:/Users/vasan/OneDrive/Desktop/Report/render.yaml)**: Render Blueprint file for 1-click automatic setup.
2. **[`backend/requirements.txt`](file:///c:/Users/vasan/OneDrive/Desktop/Report/backend/requirements.txt)**: List of Python dependencies.
3. **[`backend/Procfile`](file:///c:/Users/vasan/OneDrive/Desktop/Report/backend/Procfile)**: Uvicorn web server start command.
4. **[`src/config/urls.ts`](file:///c:/Users/vasan/OneDrive/Desktop/Report/src/config/urls.ts)**: Configured to support dynamic `VITE_API_URL`.

---

## ⚡ Option 1: Automatic Deployment using Render Blueprints (Recommended)

1. Push your project code to a **GitHub** or **GitLab** repository.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprints**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and create:
   * **`reportsync-backend`** (Python Web Service)
   * **`reportsync-frontend`** (Static Site)
6. Click **Apply**.
7. Once deployed:
   * Copy the URL of your backend (e.g. `https://reportsync-backend.onrender.com`).
   * Go to **`reportsync-frontend`** → **Environment** → add variable:
     * **Key**: `VITE_API_URL`
     * **Value**: `https://reportsync-backend.onrender.com/`
   * Click **Save Changes** (Render will re-deploy the frontend).

---

## 🛠️ Option 2: Manual Step-by-Step Setup on Render

### Step 1: Deploy the FastAPI Backend (Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   * **Name**: `reportsync-backend`
   * **Region**: Choose closest to your users (e.g., Singapore / Oregon).
   * **Branch**: `main` (or `master`)
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   * `JWT_SECRET`: *(Enter any random secret key)*
   * *(Optional)* `DATABASE_URL`: *(Your production database URL, e.g. PostgreSQL or MySQL)*
5. Click **Create Web Service**.
6. Copy your backend live URL once build finishes (e.g. `https://reportsync-backend.onrender.com`).

---

### Step 2: Deploy the React Frontend (Static Site)
1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Static Site**.
2. Connect your GitHub repository.
3. Configure the settings:
   * **Name**: `reportsync-frontend`
   * **Branch**: `main` (or `master`)
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://reportsync-backend.onrender.com/` *(replace with your actual backend URL)*
5. Click **Create Static Site**.

---

## 🌐 SPA Routing Rule (Required for React Router)
In your Render Frontend Dashboard:
1. Go to **Redirects / Rewrites**.
2. Add rule:
   * **Source**: `/*`
   * **Destination**: `/index.html`
   * **Action**: `Rewrite`

---

## 🎉 Done!
Your application is now live on Render!
* **Frontend Site**: `https://reportsync-frontend.onrender.com`
* **Backend API Docs**: `https://reportsync-backend.onrender.com/docs`
