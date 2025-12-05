import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import Subjects from "./Subjects";
import PdfListPage from "./PdfListPage.jsx";
import PdfViewer from "./PdfViewer";
import "./StudyMaterials.css";

const StudyMaterials = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentParams, setCurrentParams] = useState({});

  // Default user if not provided
  const defaultUser = user || { username: "Student" };
  
  const handleLogout = onLogout || (() => {
    console.log("User logged out");
  });

  // --- FIX START: SCROLL TO TOP ---
  // This useEffect ensures that whenever the internal view changes 
  // (e.g., Dashboard -> Subjects, or Subjects -> PdfList), 
  // the page automatically scrolls to the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, currentParams]);
  // --- FIX END ---

  // --- LISTENER FOR BACK BUTTON ---
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      const parts = hash.split('/');
      // Expected Format: #StudyMaterials/<view>/<cycle>/<type>/<subjectId>
      
      if (parts.length >= 2) {
        const view = parts[1]; // subjects, pdfList, etc.
        
        if (view === 'subjects') {
          setCurrentView('subjects');
          setCurrentParams({ cycle: parts[2], type: parts[3] });
        } else if (view === 'pdfList') {
          setCurrentView('pdfList');
          setCurrentParams({ cycle: parts[2], type: parts[3], subjectId: parts[4] });
        } else if (view === 'pdfViewer') {
           setCurrentView('pdfViewer');
           setCurrentParams({ cycle: parts[2], type: parts[3], subjectId: parts[4], pdfId: parts[5] });
        } else {
          // If just #StudyMaterials or unknown
          setCurrentView('dashboard');
          setCurrentParams({});
        }
      } else {
        // Fallback to dashboard
        setCurrentView('dashboard');
        setCurrentParams({});
      }
    };

    // Listen to history changes
    window.addEventListener('popstate', handlePopState);
    
    // Check initial load (in case user refreshes on a sub-page)
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Standard Navigate Function (Updates internal state)
  const navigateTo = (view, params = {}) => {
    setCurrentView(view);
    setCurrentParams(params);
  };

  // Helper for internal back button (optional, if you use the arrow button in UI)
  const navigateBack = () => {
    window.history.back();
  };

  // Render current view based on state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            user={defaultUser} 
            onLogout={handleLogout}
            onNavigate={navigateTo}
          />
        );
      
      case 'subjects':
        return (
          <Subjects 
            user={defaultUser} 
            onLogout={handleLogout}
            cycle={currentParams.cycle}
            type={currentParams.type}
            onNavigate={navigateTo}
            onBack={navigateBack}
          />
        );
      
      case 'pdfList':
        return (
          <PdfListPage 
            user={defaultUser} 
            onLogout={handleLogout}
            cycle={currentParams.cycle}
            type={currentParams.type}
            subjectId={currentParams.subjectId}
            onNavigate={navigateTo}
            onBack={navigateBack}
          />
        );
      
      case 'pdfViewer':
        return (
          <PdfViewer 
            user={defaultUser} 
            onLogout={handleLogout}
            cycle={currentParams.cycle}
            subjectId={currentParams.subjectId}
            type={currentParams.type}
            pdfId={currentParams.pdfId}
            onNavigate={navigateTo}
            onBack={navigateBack}
          />
        );
      
      default:
        return (
          <Dashboard 
            user={defaultUser} 
            onLogout={handleLogout}
            onNavigate={navigateTo}
          />
        );
    }
  };

  return (
    <div className="study-materials-container">
      <div className="study-materials-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default StudyMaterials;