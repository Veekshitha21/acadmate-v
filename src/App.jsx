import React, { useState, useEffect, useCallback } from 'react';
import { Linkedin, Github } from 'lucide-react';
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
  const isNavigatingFromBrowser = React.useRef(false);

  // Team members
  const teamMembers = [
    { name: 'Bhaskara', linkedin: 'https://www.linkedin.com/in/bhaskara-88aa76322/', github: 'https://github.com/bhaskara05' },
    { name: 'Khushal L', linkedin: 'https://linkedin.com/khushal-l', github: 'https://github.com/Khushal1513' },
    { name: 'Veekshitha K', linkedin: 'https://www.linkedin.com/in/veekshitha-k-2145-dbrv-/', github: 'https://github.com/Veekshitha21' },
    { name: 'Shri Chandana S Y', linkedin: 'https://www.linkedin.com/in/shrichandanasy', github: 'https://github.com/Shri2320' },
    { name: 'Manasa H N', linkedin: 'https://www.linkedin.com/in/manasa-h-n-0383bb331/', github: 'https://github.com/Manasa32264' },
    { name: 'Prasad A M', linkedin: 'https://www.linkedin.com/in/amprasad18', github: 'https://github.com/am-prasad' },
    { name: 'Nithin G', linkedin: 'https://www.linkedin.com/in/nithing17', github: 'https://github.com/17nithinnayak' },
    { name: 'Sthuthi Sheela', linkedin: 'https://www.linkedin.com/in/sthuthi-sheela-80571530b', github: 'https://github.com/Sthuthi1310' },
    { name: 'Dileep', linkedin: 'https://www.linkedin.com/in/dileep-shivakumar-b577982b2/', github: 'https://github.com/Dileep-S-S' }
  ];

  // Utilities
  const nameToSlug = (fullName) =>
    fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sanitizeUrl = (url) => (url ? url.trim() : '#');
  const ensureHttps = (raw) => {
    const s = sanitizeUrl(raw);
    if (s === '#') return s;
    return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/\//, '')}`;
  };
  const normalizeLinkedinUrl = (raw) => {
    try {
      const withProto = ensureHttps(raw);
      const u = new URL(withProto);
      if (u.hostname.includes('linkedin.com') && !u.pathname.startsWith('/in/')) {
        const cleanPath = u.pathname && u.pathname !== '/' ? u.pathname : '';
        u.pathname = `/in${cleanPath.startsWith('/') ? '' : '/'}${cleanPath.replace(/^\/+/, '')}`;
      }
      return u.toString();
    } catch {
      return ensureHttps(raw);
    }
  };

  // Handlers
  const handleLogin = (data) => {
    setUserData(data);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    setShowProfile(false);
    setActiveSection('Home');
    try { window.history.pushState({ section: 'Home' }, '', '#Home'); } catch {}
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
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <CalendarPage />
          </ProtectedRoute>
        );
      case 'Chatbot':
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <ChatbotHub />
          </ProtectedRoute>
        );
      case 'Study Materials':
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <StudyMaterials user={userData} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'About Us':
        return (
          <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
            <div className="min-h-screen custom-beige py-12 px-4">
              <div className="max-w-7xl mx-auto text-center">
                <p className="text-lg custom-brown opacity-90 max-w-3xl mx-auto leading-relaxed">
                  AcadMate is your companion from doubts to degrees.
                  <br />
                  We connect students with tools, peers, and guidance to learn smarter every day.
                </p>
                <h1 className="mt-8 text-5xl font-extrabold custom-brown heading-glow">Meet Our Team</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="relative group [perspective:1000px]">
                      <div className="relative h-80 w-full rounded-2xl shadow-xl transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                          <img
                            src={`/team/${nameToSlug(member.name)}.jpg`}
                            alt={member.name}
                            className="h-24 w-24 rounded-full object-cover shadow-md mb-4"
                            onError={(e) => {
                              const slug = nameToSlug(member.name);
                              const img = e.currentTarget;
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = 'png';
                                img.src = `/team/${slug}.png`;
                              } else if (img.dataset.fallback === 'png') {
                                img.dataset.fallback = 'avatar';
                                img.src = `https://i.pravatar.cc/300?u=${encodeURIComponent(slug)}`;
                              }
                            }}
                          />
                          <h3 className="text-2xl font-bold custom-brown mb-2">{member.name}</h3>
                          <p className="text-sm custom-brown opacity-70">Team Member</p>
                        </div>
                        <div className="absolute inset-0 bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                          <h4 className="text-xl font-semibold custom-brown">Connect</h4>
                          <div className="flex items-center gap-6">
                            <a href={normalizeLinkedinUrl(member.linkedin)} target="_blank" rel="noreferrer" className="p-3 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-brown transition-colors">
                              <Linkedin className="h-5 w-5" />
                            </a>
                            <a href={ensureHttps(member.github)} target="_blank" rel="noreferrer" className="p-3 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-brown transition-colors">
                              <Github className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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