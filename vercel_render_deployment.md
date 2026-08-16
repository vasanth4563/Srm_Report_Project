# 🌐 Deploying Frontend (Vercel) + Backend (Render)

This guide walks you through deploying your **React Frontend** to **Vercel** and your **FastAPI Backend** to **Render**, connecting them together.

---

## 🛠️ Step 1: Deploy the FastAPI Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub/GitLab repository.
4. Configure the Web Service details:
   * **Name**: `srm-reports-backend`
   * **Region**: Choose a region close to your database (e.g., Singapore or Oregon).
   * **Branch**: `main`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add **Environment Variables**:
   * **`JWT_SECRET`**: *(Generate any random strong key string)*
   * **`DATABASE_URL`**: *(Your production database connection string, e.g., `mysql+pymysql://user:pass@host:3306/db`)*
6. Click **Create Web Service**.
7. Wait for the build to finish. Once live, copy your backend's URL at the top of the page:
   `https://srm-reports-backend.onrender.com`

---

## ⚡ Step 2: Deploy the React Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** → **Project**.
3. Import your GitHub/GitLab repository.
4. Configure the Project settings:
   * **Framework Preset**: Vercel automatically detects **Vite**; keep it selected.
   * **Root Directory**: Keep it blank (root folder `./`).
   * **Build and Output Settings**: Keep defaults (Vite builds into `dist` automatically).
5. Expand the **Environment Variables** section and add:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://srm-reports-backend.onrender.com/` *(Make sure to replace this with your actual Render backend URL, and include the trailing slash `/`)*
6. Click **Deploy**.

---

## 🔗 SPA Routing Configured
Vercel requires custom redirect configurations to allow React Router to load paths (like `/dashboard` or `/login`) on page refresh. 

I have created a **[`vercel.json`](file:///c:/Users/vasan/OneDrive/Desktop/Report/vercel.json)** file in your project root which contains:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This is already included in your codebase and Vercel will apply it automatically upon deployment!
