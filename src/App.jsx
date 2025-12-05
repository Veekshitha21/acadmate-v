import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import Profile from './components/Profile';
import SeniorsPage from './components/SeniorsPage.jsx';
import CalendarPage from './components/CalendarPage.jsx';
import Task from './components/TaskMananger/Task.jsx';
import ChatbotHub from './components/ChatbotHub.jsx';
import StudyMaterials from './components/StudyMaterials.jsx';
import AboutUs from './components/AboutUs.jsx';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const stateSection = window.history.state && window.history.state.section;
      if (stateSection) return stateSection;
    } catch {}
    const rawHash = window.location.hash || '';
    if (rawHash.startsWith('#Task-')) {
      return 'TaskManager';
    }
    const hash = rawHash.replace('#', '');
    return hash || 'Home';
  });
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [pendingSection, setPendingSection] = useState(null);
  const isNavigatingFromBrowser = React.useRef(false);

    // When navigating to the Chatbot section, ensure the page is at the top
    useEffect(() => {
      if (activeSection === 'Chatbot') {
        try {
          // Disable automatic scroll restoration if available and jump to top
          if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
          }
          window.scrollTo({ top: 0, behavior: 'auto' });
        } catch {}
      }
    }, [activeSection]);

  const protectedSections = new Set([
    'Seniors',
    'TaskManager',
    'EventBuddy',
    'Chatbot',
    'Study Materials',
    'About Us',
    'Profile',
  ]);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Handlers
  const handleLogin = (data) => {
    setUserData(data);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    setShowProfile(false);

    const target = pendingSection || 'Home';
    setActiveSection(target);
    try { window.history.pushState({ section: target }, '', `#${target.replace(/\s+/g, '')}`); } catch {}
    scrollToTop();

    setPendingSection(null);
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
    setIsLoggedIn(false);
    setUserData(null);
    setShowProfile(false);
    setActiveSection('Home');
    try { window.history.pushState({ section: 'Home' }, '', '#Home'); } catch {}
  };

  const handleSectionChange = (section) => {
    if (!isLoggedIn && protectedSections.has(section)) {
      setPendingSection(section);
      setIsLoginModalOpen(true);
    }

    if (section === activeSection) return;
    
    if (isNavigatingFromBrowser.current) {
      if (section !== 'Profile') setShowProfile(false);
      setActiveSection(section);
      return;
    }
    
    if (section !== 'Profile') setShowProfile(false);
    setActiveSection(section);

    const hash = `#${section.replace(/\s+/g, '')}`;
    try { 
      window.history.pushState({ section }, '', hash); 
    } catch (e) {
      console.error('Error pushing state:', e);
    }
    scrollToTop();
  };

  const hashToSectionMap = {
    'Home': 'Home',
    'Seniors': 'Seniors',
    'TaskManager': 'TaskManager',
    'EventBuddy': 'EventBuddy',
    'Chatbot': 'Chatbot',
    'StudyMaterials': 'Study Materials',
    'AboutUs': 'About Us',
    'Profile': 'Profile'
  };

  const getSectionFromUrl = useCallback((e = null) => {
    const hash = window.location.hash || '';
    const isTaskRoute = hash.startsWith('#Task-');
    if (isTaskRoute) return 'TaskManager';

    let stateSection = null;
    if (e && e.state && e.state.section) {
      stateSection = e.state.section;
    } else if (window.history.state && window.history.state.section) {
      stateSection = window.history.state.section;
    }

    if (hash && hash !== '#TaskManager') {
      const hashSection = hash.replace('#', '').trim();
      const recognizedSections = Object.keys(hashToSectionMap);
      const isRecognizedSection = recognizedSections.some(s => hashSection === s || hashSection === s.replace(/\s+/g, ''));
      if (isRecognizedSection && stateSection === 'TaskManager') {
        return hashToSectionMap[hashSection] || hashSection || 'Home';
      }
    }

    if (stateSection) return stateSection;

    const hashSection = hash.replace('#', '').trim();
    if (hashSection) return hashToSectionMap[hashSection] || hashSection || 'Home';

    return 'Home';
  }, []);

  const updateSectionFromHistory = useCallback((e = null, isPopStateEvent = false) => {
    const section = getSectionFromUrl(e);

    if (section === 'Profile' && !isLoggedIn) {
      setActiveSection('Home');
      setShowProfile(false);
      if (!isPopStateEvent) {
        try { window.history.replaceState({ section: 'Home' }, '', '#Home'); } catch {}
      }
      return;
    }

    if (section === 'Profile') setShowProfile(true);
    else setShowProfile(false);
    
    setActiveSection(section);
    
    if (!isPopStateEvent && (!e || !e.state || !e.state.section)) {
      try {
        const hash = section === 'TaskManager' 
          ? window.location.hash 
          : `#${section.replace(/\s+/g, '')}`;
        const currentHash = window.location.hash || '';
        const expectedHash = section === 'TaskManager' ? currentHash : `#${section.replace(/\s+/g, '')}`;
        if (currentHash !== expectedHash) {
          window.history.replaceState({ section }, '', expectedHash);
        }
      } catch {}
    }
  }, [isLoggedIn, getSectionFromUrl]);

  useEffect(() => {
    let hashChangeTimeout = null;
    
    const onPopState = (e) => {
      if (hashChangeTimeout) {
        clearTimeout(hashChangeTimeout);
        hashChangeTimeout = null;
      }
      isNavigatingFromBrowser.current = true;
      updateSectionFromHistory(e, true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isNavigatingFromBrowser.current = false;
        });
      });
    };

    const onHashChange = () => {
      if (hashChangeTimeout) clearTimeout(hashChangeTimeout);
      hashChangeTimeout = setTimeout(() => {
        const currentState = window.history.state;
        const currentHash = window.location.hash || '';
        if (currentHash && !currentHash.startsWith('#Task-')) {
          if (!currentState || !currentState.section) {
            updateSectionFromHistory(null, false);
          } else {
            const expectedHash = `#${currentState.section.replace(/\s+/g, '')}`;
            if (currentHash !== expectedHash) {
              updateSectionFromHistory(null, false);
            }
          }
        }
        hashChangeTimeout = null;
      }, 50);
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
    
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      if (hashChangeTimeout) {
        clearTimeout(hashChangeTimeout);
        hashChangeTimeout = null;
      }
    };
  }, [isLoggedIn, updateSectionFromHistory]);

  useEffect(() => {
    try {
      const currentHash = window.location.hash || '';
      const currentState = window.history.state;
      
      if (!currentState || !currentState.section) {
        let currentSection = getSectionFromUrl();
        
        if (currentHash.startsWith('#Task-')) {
          currentSection = 'TaskManager';
          window.history.replaceState({ section: 'TaskManager' }, '', currentHash);
        } else if (currentHash) {
          const safeHash = `#${currentSection.replace(/\s+/g, '')}`;
          window.history.replaceState({ section: currentSection }, '', safeHash);
        } else {
          currentSection = 'Home';
          window.history.replaceState({ section: 'Home' }, '', '#Home');
        }
        
        if (currentSection !== activeSection) {
          setActiveSection(currentSection);
          if (currentSection === 'Profile') setShowProfile(true);
        }
      } else {
        const stateSection = currentState.section;
        if (stateSection !== activeSection) {
          setActiveSection(stateSection);
          if (stateSection === 'Profile') setShowProfile(true);
        }
      }
    } catch (e) {
      console.error('Error initializing history state:', e);
    }
  }, []);

  const renderContent = () => {
    if (showProfile && userData) {
      return (
        <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
          <Profile user={userData} onLogout={handleLogout} />
        </ProtectedRoute>
      );
    }

    switch (activeSection) {
      case 'Profile':
        if (userData) {
          return (
            <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
              <Profile user={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          );
        } else {
          return (
            <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
              <div>Loading...</div>
            </ProtectedRoute>
          );
        }
      case 'Home': 
        return <Home onSectionChange={handleSectionChange} isLoggedIn={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)} />;
      case 'Seniors': 
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <SeniorsPage onBackToHome={handleBackToHome} />
          </ProtectedRoute>
        );
      case 'TaskManager': 
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <Task />
          </ProtectedRoute>
        );
      case 'EventBuddy': 
        return (
          <ProtectedRoute
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => {
              setPendingSection('EventBuddy');
              setIsLoginModalOpen(true);
            }}
          >
            <CalendarPage />
          </ProtectedRoute>
        );
      case 'Chatbot':
        return (
          <ProtectedRoute
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => {
              setPendingSection('Chatbot');
              setIsLoginModalOpen(true);
            }}
          >
            <ChatbotHub />
          </ProtectedRoute>
        );
      case 'Study Materials':
        return (
          <ProtectedRoute
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => {
              setPendingSection('Study Materials');
              setIsLoginModalOpen(true);
            }}
          >
            <StudyMaterials user={userData} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'About Us':
        return (
          <ProtectedRoute
            isAuthenticated={isLoggedIn}
            onLoginRequired={() => {
              setPendingSection('About Us');
              setIsLoginModalOpen(true);
            }}
          >
            <AboutUs />
          </ProtectedRoute>
        );
      default:
        return <Home onSectionChange={handleSectionChange} isLoggedIn={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen custom-beige">
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogin={() => setIsLoginModalOpen(true)}
        onShowProfile={handleShowProfile}
        onLogout={handleLogout}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* THIS IS THE FIX: The wrapper that pushes content down */}
      <div className="pt-16">
        {renderContent()}
      </div>

      {activeSection !== 'Chatbot' && <Footer onSectionChange={handleSectionChange} />}
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;