import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import Profile from "./components/Profile";
import SeniorsPage from "./components/SeniorsPage";
import CalendarPage from "./components/CalendarPage";
import Task from "./components/TaskMananger/Task";
import ChatbotHub from "./components/ChatbotHub";
// Chat page and floating chat button removed per request
import StudyMaterials from "./components/StudyMaterials";
import ProtectedRoute from "./components/ProtectedRoute";

/* ===== Discussion Pages ===== */
import DiscussionList from "./components/discussion/DiscussionList";
import CreateDiscussion from "./components/discussion/CreateDiscussion";
import DiscussionDetail from "./components/discussion/DiscussionDetail";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "Home";
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  /* ================= Restore Login ================= */
  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedLogin === "true" && storedUser && token) {
      const user = JSON.parse(storedUser);
      
      // Normalize on restore too
      const normalizedUser = {
        ...user,
        uid: user.id || user._id || user.uid,
        displayName: user.username || user.displayName || user.name,
      };
      
      setIsLoggedIn(true);
      setUserData(normalizedUser);
    }
  }, []);

  /* ================= Handlers ================= */
  const handleLogin = (user) => {
  // Normalize user data to include uid field for discussion system
    const normalizedUser = {
      ...user,
      uid: user.id || user._id || user.uid, // Ensure uid exists
      displayName: user.username || user.displayName || user.name,
    };
    
    setUserData(normalizedUser);
    setIsLoggedIn(true);

    // Update localStorage with normalized data
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({
      ...storedUser,
      ...normalizedUser
    }));

    setIsLoginModalOpen(false);
    setShowProfile(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserData(null);
    setShowProfile(false);
    // preserve current route after logout so discussion pages remain visible
  };

  const handleShowProfile = () => {
    // If we're on a discussion route, navigate to home first
    if (location.pathname.startsWith('/discussions')) {
      navigate('/');
    }
    
    setShowProfile(true);
    setActiveSection("Profile");
    try {
      window.history.pushState({ section: "Profile" }, "", "#Profile");
    } catch {}
  };

  const handleSectionChange = (section) => {
    // If we're on a discussion route, navigate to home first
    if (location.pathname.startsWith('/discussions')) {
      navigate('/');
    }
    
    if (section !== "Profile") setShowProfile(false);
    setActiveSection(section);
    try {
      window.history.pushState({ section }, "", `#${section}`);
    } catch {}
  };

  /* ================= Browser Back / Forward ================= */
  useEffect(() => {
    const onPop = (e) => {
      const section =
        (e.state && e.state.section) ||
        window.location.hash.replace("#", "") ||
        "Home";

      if (section === "Profile" && !isLoggedIn) {
        setActiveSection("Home");
        return;
      }

      setShowProfile(section === "Profile");
      setActiveSection(section);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isLoggedIn]);

  /* Keep legacy `activeSection` in sync with route-based navigation */
  useEffect(() => {
    try {
      if (location.pathname.startsWith('/discussions')) {
        setActiveSection('Discussions');
      } else if (location.pathname === '/') {
        // Reset to the hash-based section when returning to home
        const hash = window.location.hash.replace("#", "") || "Home";
        setActiveSection(hash);
      }
    } catch {}
  }, [location.pathname]);

  /* ================= Legacy App Content ================= */
  const renderLegacyContent = () => {
    if (showProfile && userData) {
      return (
        <ProtectedRoute
          isAuthenticated={isLoggedIn}
          onLoginRequired={() => setIsLoginModalOpen(true)}
        >
          <Profile user={userData} onLogout={handleLogout} />
        </ProtectedRoute>
      );
    }

    switch (activeSection) {
      case "Home":
        return (
          <Home
            isLoggedIn={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
            onSectionChange={handleSectionChange}
          />
        );

      case "Seniors":
        return (
          <ProtectedRoute 
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <SeniorsPage />
          </ProtectedRoute>
        );

      case "TaskManager":
        return (
          <ProtectedRoute 
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <Task />
          </ProtectedRoute>
        );

      case "EventBuddy":
        return (
          <ProtectedRoute 
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <CalendarPage />
          </ProtectedRoute>
        );

      case "Chatbot":
        return (
          <ProtectedRoute 
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <ChatbotHub />
          </ProtectedRoute>
        );

      /* Chat route removed */

      case "Study Materials":
        return (
          <ProtectedRoute 
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <StudyMaterials user={userData} />
          </ProtectedRoute>
        );

      default:
        return <Home onSectionChange={handleSectionChange} />;
    }
  };

  /* ================= JSX ================= */
  return (
    <div className="min-h-screen custom-beige">
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onShowProfile={handleShowProfile}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <div className="pt-16">
        <Routes>
          {/* 🔹 Discussion Routes */}
          <Route 
            path="/discussions" 
            element={
              <DiscussionList 
                isLoggedIn={isLoggedIn}
                userData={userData}
              />
            } 
          />

          <Route
            path="/discussions/new"
            element={
              <ProtectedRoute isAuthenticated={isLoggedIn}>
                <CreateDiscussion 
                  userData={userData}
                  isLoggedIn={isLoggedIn}
                />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/discussions/:id" 
            element={
              <DiscussionDetail 
                isLoggedIn={isLoggedIn}
                userData={userData}
              />
            } 
          />

          {/* 🔹 Main App - MUST BE LAST */}
          <Route path="/" element={renderLegacyContent()} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {activeSection !== "Chatbot" && !location.pathname.startsWith('/discussions') && (
        <Footer onSectionChange={handleSectionChange} />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;