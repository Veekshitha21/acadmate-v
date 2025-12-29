import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import Profile from "./components/Profile";
import SeniorsPage from "./components/SeniorsPage";
import CalendarPage from "./components/CalendarPage";
import Task from "./components/TaskMananger/Task";
import ChatbotHub from "./components/ChatbotHub";
import StudyMaterials from "./components/StudyMaterials";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "Home";
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  /* ================== Restore Login ================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  /* ================== Navigation ================== */
  /* Navigation handled by single handler defined below. */

  // Handlers
  // const handleLogin = (data) => {
  //   setUserData(data);
  //   setIsLoggedIn(true);
  //   setIsLoginModalOpen(false);
  //   setShowProfile(false);
  //   setActiveSection('Home');
  //   try { window.history.pushState({ section: 'Home' }, '', '#Home'); } catch {}
  // };
  const handleLogin = (data) => {
    setUserData(data);
    setIsLoggedIn(true);

    // ✅ persist login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(data));

    setIsLoginModalOpen(false);
    setShowProfile(false);
    setActiveSection('Home');

    try {
      window.history.pushState({ section: 'Home' }, '', '#Home');
    } catch {}
  };

  const handleShowProfile = () => {
    setShowProfile(true);
    setActiveSection('Profile');
    try { window.history.pushState({ section: 'Profile' }, '', '#Profile'); } catch {}
  };
  const handleBackToHome = () => {
    setShowProfile(false);
    setActiveSection('Home');
    try { window.history.pushState({ section: 'Home' }, '', '#Home'); } catch {}
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserData(null);
    setShowProfile(false);
    setActiveSection('Home');

    // ✅ clear persisted data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');

    try {
      window.history.pushState({ section: 'Home' }, '', '#Home');
    } catch {}
  };


  const handleSectionChange = (section) => {
    // Reset showProfile when navigating to any section other than Profile
    if (section !== 'Profile') {
      setShowProfile(false);
    }
    setActiveSection(section);
    // Push into browser history so back/forward works
    try { window.history.pushState({ section }, '', `#${section.replace(/\s+/g, '')}`); } catch {}
  };

  /* ================== Browser Back / Forward ================== */
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
  useEffect(() => {
    const storedLogin = localStorage.getItem('isLoggedIn');
    const storedUser = localStorage.getItem('userData');

    if (storedLogin === 'true' && storedUser) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(storedUser));
    }
  }, []);


  /* ================== Render Content ================== */
  const renderContent = () => {
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

      case "Profile":
        return (
          <ProtectedRoute
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => setIsLoginModalOpen(true)}
          >
            <Profile user={userData} onLogout={handleLogout} />
          </ProtectedRoute>
        );

      case "Seniors":
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <SeniorsPage />
          </ProtectedRoute>
        );

      case "TaskManager":
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <Task />
          </ProtectedRoute>
        );

      case "EventBuddy":
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <CalendarPage />
          </ProtectedRoute>
        );

      case "Chatbot":
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <ChatbotHub />
          </ProtectedRoute>
        );

      case "Study Materials":
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <StudyMaterials user={userData} />
          </ProtectedRoute>
        );

      default:
        return <Home onSectionChange={handleSectionChange} />;
    }
  };

  /* ================== JSX ================== */
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

      <div className="pt-16">{renderContent()}</div>

      {activeSection !== "Chatbot" && (
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
