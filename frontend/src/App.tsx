import { useContext } from 'react';
// Main App Component
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import KnowledgeFeed from './pages/KnowledgeFeed.tsx';
import CreatePost from './pages/CreatePost.tsx';
import PostDetail from './pages/PostDetail.tsx';
import LandingPage from './pages/LandingPage.tsx';
import Profile from './pages/Profile.tsx';
import LearningPaths from './pages/LearningPaths.tsx';
import PathDetail from './pages/PathDetail.tsx';
import ProjectGallery from './pages/ProjectGallery.tsx';
import SubmitProject from './pages/SubmitProject.tsx';
import ProjectDetail from './pages/ProjectDetail.tsx';
import Events from './pages/Events.tsx';
import Community from './pages/Community.tsx';
import ChatRoom from './pages/ChatRoom.tsx';
import SearchPage from './pages/SearchPage.tsx';
import Bookmarks from './pages/Bookmarks.tsx';
import ModerationQueue from './pages/ModerationQueue.tsx';
import Collections from './pages/Collections.tsx';
import MyPosts from './pages/MyPosts.tsx';
import EditProfile from './pages/EditProfile.tsx';

const HomeRoute = () => {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return auth?.user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          style: {
            zIndex: 99999,
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes - login required */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/dashboard" element={<KnowledgeFeed />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/users/:id" element={<Profile />} />
            <Route path="/settings/profile" element={<EditProfile />} />
            <Route path="/learning-paths" element={<LearningPaths />} />
            <Route path="/learning-paths/:id" element={<PathDetail />} />

            <Route path="/projects" element={<ProjectGallery />} />
            <Route path="/submit-project" element={<SubmitProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            <Route path="/events" element={<Events />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/rooms/:id" element={<ChatRoom />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/moderation" element={<ModerationQueue />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
