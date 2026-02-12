<a name="readme-top"></a>

<!-- PROJECT HEADER -->
<br />
<div align="center">
  <a href="https://github.com/bdharshan22/Knowledge-Sharing-Portal">
    <img src="https://img.shields.io/badge/Knowledge-Sharing%20Portal-cyan?style=for-the-badge&logo=knowledgebase&logoColor=white" alt="Logo" width="300" height="auto">
  </a>

  <h1 align="center">Knowledge Sharing Portal</h1>

  <p align="center">
    A professional-grade, full-stack platform for collaborative learning, knowledge exchange, and community building.
    <br />
    <a href="#demo"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#live-demo">View Demo</a>
    ·
    <a href="https://github.com/bdharshan22/Knowledge-Sharing-Portal/issues">Report Bug</a>
    ·
    <a href="https://github.com/bdharshan22/Knowledge-Sharing-Portal/issues">Request Feature</a>
  </p>
</div>

<!-- BADGES -->
<div align="center">

![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Nodejs](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.0-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-9.0-47A248?style=flat-square&logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary><strong>Table of Contents</strong></summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Run Locally</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

---

## 🚀 About The Project

The **Knowledge Sharing Portal** is a modern, feature-rich application designed to facilitate seamless knowledge exchange within organizations or communities. Inspired by platforms like Stack Overflow, Medium, and Notion, it combines the best aspects of Q&A forums, blogging platforms, and learning management systems.

Built with a focus on **User Experience (UX)** and **Performance**, the portal features a stunning **Glassmorphism UI**, real-time interactions, and a robust gamification system to keep users engaged.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## ✨ Key Features

### 🧠 Knowledge Management
*   **Rich Content Creation**: Markdown support with syntax highlighting, image uploads, and auto-saving drafts.
*   **Advanced Q&A**: Dedicated question format with voting, answer acceptance, and bounties.
*   **Smart Search**: Full-text search with history, filters, and highlighting.
*   **Table of Contents**: Auto-generated TOC for long-form articles.

### 👥 Community & Social
*   **User Profiles**: comprehensive stats, skills, **Activity Timeline**, and reputation tracking.
*   **Knowledge Feed**: Personalized feed with advanced filtering (tags, types, sorting).
*   **Real-time Chat**: Socket.io powered chat rooms for communities.
*   **Social Interactions**: Follow users, like/bookmark posts, threaded comments.

### 🎮 Gamification & Growth
*   **Reputation System**: Earn points for contributions (posts, answers, likes).
*   **Badges & Achievements**: Unlock milestones for continuous engagement.
*   **Leaderboards**: Weekly and all-time top contributors.
*   **Learning Paths**: Structured curriculums with progress tracking and reminders.

### 🛡️ Admin & Moderation
*   **Moderation Queue**: Tools for reviewing flagged content.
*   **Role-Based Access**: Granular permissions for Admins, Moderators, and Users.
*   **Analytics**: Insights into platform usage and engagement.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🛠 Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
*   **Routing**: [React Router v7](https://reactrouter.com/)
*   **State**: Context API + Hooks

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js 5](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose 9)
*   **Real-time**: [Socket.io](https://socket.io/)
*   **Caching**: Redis
*   **Storage**: Cloudinary (Image/Media)
*   **Auth**: JWT (Access + Refresh Tokens) + Google OAuth

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   Redis (Optional, for caching)
*   Cloudinary Account (for media)

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/bdharshan22/Knowledge-Sharing-Portal.git
    cd Knowledge-Sharing-Portal
    ```

2.  **Install Backend Dependencies**
    ```sh
    cd backend
    npm install
    ```

3.  **Configure Backend Environment**
    Create a `.env` file in `backend/` directory:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    JWT_REFRESH_SECRET=your_refresh_secret
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_key
    CLOUDINARY_API_SECRET=your_secret
    CLIENT_URL=http://localhost:5173
    ```

4.  **Install Frontend Dependencies**
    ```sh
    cd ../frontend
    npm install
    ```

5.  **Configure Frontend Environment**
    Create a `.env` file in `frontend/` directory:
    ```env
    VITE_API_URL=http://localhost:5000/api
    VITE_SOCKET_URL=http://localhost:5000
    VITE_GOOGLE_CLIENT_ID=your_google_client_id
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🏃 Run Locally

**1. Start the Backend Server**
```sh
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**2. Start the Frontend Client**
```sh
cd frontend
npm run dev
# Client runs on http://localhost:5173
```

**3. Seed Data (Optional)**
```sh
# In backend directory
npm run seed
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

