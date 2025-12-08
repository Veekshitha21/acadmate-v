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
  const [activeSection, setActiveSection] = useState('Home');
  const [componentKey, setComponentKey] = useState(0); 

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const isNavigatingFromBrowser = React.useRef(false);

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
    if (hash.startsWith('#Task-')) return 'TaskManager';

    // FIX: Only look at the part before the first slash
    const cleanHash = hash.replace('#', '').split('/')[0].trim();

    if (cleanHash && cleanHash !== 'TaskManager') {
      const recognizedSections = Object.keys(hashToSectionMap);
      const isRecognizedSection = recognizedSections.some(s => cleanHash === s || cleanHash === s.replace(/\s+/g, ''));
      if (isRecognizedSection) {
         return hashToSectionMap[cleanHash] || cleanHash;
      }
    }
    return 'Home';
  }, []);

  useEffect(() => {
    const section = getSectionFromUrl();
    setActiveSection(section);
  }, [getSectionFromUrl]);


  useEffect(() => {
    const onPopState = (e) => {
      isNavigatingFromBrowser.current = true;
      const section = getSectionFromUrl(e);
      
      // FIX: Only force-reset Study Materials if we are at the ROOT of Study Materials
      // If the URL is #StudyMaterials/subjects/..., we let StudyMaterials.jsx handle it.
      if (section === 'Study Materials' && !window.location.hash.includes('/')) {
        setComponentKey(prev => prev + 1);
      }

      handleSectionChangeInternal(section, true);
      setTimeout(() => { isNavigatingFromBrowser.current = false; }, 100);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getSectionFromUrl]);

  const handleSectionChangeInternal = (section, isFromBrowser = false) => {
    if (section === 'Profile' && !isLoggedIn) {
      setActiveSection('Home');
      setShowProfile(false);
      if (!isFromBrowser) window.history.replaceState({ section: 'Home' }, '', '#Home');
      return;
    }

    if (section === 'Profile') setShowProfile(true);
    else setShowProfile(false);
    
    setActiveSection(section);

    if (!isFromBrowser) {
      const hash = `#${section.replace(/\s+/g, '')}`;
      try { 
        if (window.location.hash.split('/')[0] !== hash) {
          window.history.pushState({ section }, '', hash);
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleSectionChange = (section) => {
    if (section === activeSection) return;
    handleSectionChangeInternal(section, false);
  };

  const handleLogin = (data) => {
    setUserData(data);
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
    setShowProfile(false);
    handleSectionChange('Home');
  };
  const handleShowProfile = () => { handleSectionChange('Profile'); };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setShowProfile(false);
    handleSectionChange('Home');
  };
  const handleBackToHome = () => { handleSectionChange('Home'); };

  // Team Data (Abbreviated for brevity, keep your original list)
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

  const nameToSlug = (fullName) => fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
        return userData ? (
            <ProtectedRoute isAuthenticated={isLoggedIn} onLoginRequired={() => setIsLoginModalOpen(true)}>
              <Profile user={userData} onLogout={handleLogout} />
            </ProtectedRoute>
          ) : <div>Loading...</div>;
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
            <StudyMaterials 
              key={`study-${componentKey}`} 
              user={userData} 
              onLogout={handleLogout} 
            />
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