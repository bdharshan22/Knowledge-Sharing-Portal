# Deployment Guide

Follow these steps to deploy your Knowledge Sharing Portal.

## 1. Backend Deployment (Render)

We will deploy the Node.js/Express backend to Render.com.

### Option A: Automatic Deployment (Recommended - Blueprints)
The project includes a `render.yaml` file for automated configuration.

1.  **Push** your code to GitHub.
2.  **Sign up/Log in** to [Render](https://render.com).
3.  Click **"New +"** and select **"Blueprint"**.
4.  Connect your GitHub repository.
5.  Render will read the `render.yaml` and show you the service configuration.
6.  **Environment Variables**: You will be prompted to input the values for your secrets (copy from your `.env`):
    - `MONGO_URI`
    - `JWT_SECRET`
    - `JWT_REFRESH_SECRET`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
    - `CLIENT_URL` (Set to your local URL first `http://localhost:5173` or `*`, update to Vercel URL later)
7.  Click **"Apply"**. Render will deploy your service.

### Option B: Manual Deployment

1.  **Sign up/Log in** to [Render](https://render.com).
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect to your GitHub repository.
4.  **Configure the Service**:
    - **Name**: `knowledge-portal-backend`
    - **Root Directory**: `backend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    Scroll down to "Environment Variables" and add these keys (copy values from your local `.env`):
    - `MONGO_URI`
    - `JWT_SECRET`
    - `JWT_REFRESH_SECRET`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
    - `CLIENT_URL`
6.  Click **"Create Web Service"**.
7.  **Wait**: Render will build and deploy. Once "Live", copy the **Service URL**.

---

## 2. Frontend Deployment (Vercel)

We will deploy the React/Vite frontend to Vercel.

### Steps
1.  **Sign up/Log in** to [Vercel](https://vercel.com).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Project Configuration**:
    - **Framework Preset**: Vercel should auto-detect `Vite`.
    - **Root Directory**: Click "Edit" and select the `frontend` folder.
5.  **Environment Variables**:
    Expand the "Environment Variables" section and add:
    - `VITE_API_URL`: Paste the **Render Backend URL** you copied earlier (e.g., `https://knowledge-portal-backend.onrender.com/api`).
      *Note: Ensure you add `/api` at the end if your frontend code expects it, or just the base domain if your axios config appends `/api`.*
6.  Click **"Deploy"**.
7.  Vercel will build and deploy your site.

## 3. Final Connection

1.  **Update Backend CORS**:
    - Go back to your **Render Dashboard**.
    - Update the `FRONTEND_URL` environment variable to match your new **Vercel Frontend URL** (e.g., `https://project-name.vercel.app`).
    - This ensures only your frontend can talk to your backend (security).

2.  **Verify**:
    - Open your Vercel URL.
    - Try to log in or view the feed.
    - If you see data, you are live!
