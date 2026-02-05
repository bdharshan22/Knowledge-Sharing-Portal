<a name="readme-top"></a>

<!-- PROJECT HEADER -->
<br />

<div align="center">

<img src="https://img.shields.io/badge/Knowledge--Sharing%20Portal-Professional%20Full--Stack-cyan?style=for-the-badge&logo=bookstack&logoColor=white" width="420"/>

<h1>📚 Knowledge Sharing Portal</h1>

<p>
A <strong>production-grade, full-stack knowledge platform</strong> for collaborative learning, technical discussions, and community-driven content sharing.
</p>

<p>
<a href="#-getting-started">🚀 Get Started</a>
&nbsp;•&nbsp;
<a href="#-run-locally">💻 Run Locally</a>
&nbsp;•&nbsp;
<a href="https://github.com/bdharshan22/Knowledge-Sharing-Portal/issues">🐞 Report Bug</a>
&nbsp;•&nbsp;
<a href="https://github.com/bdharshan22/Knowledge-Sharing-Portal/issues">✨ Request Feature</a>
</p>

</div>

---

## 🏷️ Tech Badges

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&style=flat-square)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-9-47A248?logo=mongodb&style=flat-square)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## 📌 About The Project

The **Knowledge Sharing Portal** is a **modern, scalable platform** that enables users to:

- 🧠 Create and manage technical knowledge  
- 💬 Ask & answer questions  
- 🤝 Collaborate with communities  
- 🎯 Learn through structured content  

Inspired by **Stack Overflow**, **Medium**, and **Notion**, this project merges **Q&A forums, blogging systems, and learning platforms** into a single, unified experience.

---

## 🌟 Why This Project Stands Out

✅ Real-world SaaS-style architecture  
✅ Clean frontend–backend separation  
✅ Secure authentication & authorization  
✅ Real-time communication (WebSockets)  
✅ Gamification for engagement  
✅ Resume & recruiter friendly  

> ⚠️ This is **not a toy project** — it’s built with **scalability and extensibility** in mind.

---

## ✨ Features Overview

### 🧠 Knowledge Management
- ✍️ Markdown editor with syntax highlighting
- 🖼 Image & media uploads (Cloudinary)
- 💾 Auto-saved drafts
- ❓ Q&A system with voting & accepted answers
- 📑 Auto-generated Table of Contents
- 🔍 Full-text search with filters

---

### 👥 Community & Collaboration
- 👤 User profiles with reputation & skills
- 📰 Personalized content feed
- 💬 Threaded comments
- 🔔 Follow users & bookmark posts
- ⚡ Real-time chat using Socket.io

---

### 🎮 Gamification
- 🏆 Reputation points
- 🎖 Badges & achievements
- 📊 Weekly & all-time leaderboards
- 🧭 Learning paths with progress tracking

---

### 🛡️ Admin & Moderation
- 🧑‍⚖️ Role-based access (Admin / Moderator / User)
- 🚩 Content reporting & review
- 📈 Platform analytics dashboard

---

## 🛠 Tech Stack

### 🎨 Frontend
| Tech | Purpose |
|----|----|
| ⚛️ React 19 | UI Framework |
| 🟦 TypeScript | Type Safety |
| ⚡ Vite | Fast Build Tool |
| 🎨 Tailwind CSS | Styling |
| 🎥 Framer Motion | Animations |
| 🧭 React Router | Routing |

---

### ⚙️ Backend
| Tech | Purpose |
|----|----|
| 🟢 Node.js | Runtime |
| 🚀 Express.js | API Framework |
| 🍃 MongoDB | Database |
| 🔌 Socket.io | Real-time |
| 🧠 Redis | Caching |
| ☁️ Cloudinary | Media Storage |
| 🔐 JWT + Google OAuth | Authentication |

---

## 🏁 Getting Started

### ✅ Prerequisites
- Node.js v18+
- MongoDB (Local / Atlas)
- Redis (optional)
- Cloudinary account

---



## ⚙️ Installation

### 1️⃣ Clone Repository
```bash
git clone https://github.com/bdharshan22/Knowledge-Sharing-Portal.git
cd Knowledge-Sharing-Portal

2️⃣ Backend Setup
cd backend
npm install
📄 backend/.env

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:5173

3️⃣ Frontend Setup
cd frontend
npm install
📄 frontend/.env

VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
🏃 Run Locally
▶️ Backend

cd backend
npm run dev
▶️ Frontend

cd frontend
npm run dev
🌐 App runs at: http://localhost:5173

📄 License

📜 MIT License — see LICENSE for details.

📬 Contact

👨‍💻 Maintained by: Dharshan B
🔗 GitHub: https://github.com/bdharshan22
