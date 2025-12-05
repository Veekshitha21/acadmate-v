// import React, { useState } from "react";
// import Dashboard from "./Dashboard";
// import Subjects from "./Subjects";
// import PdfListPage from "./PdfListPage.jsx";
// import PdfViewer from "./PdfViewer";
// import "./StudyMaterials.css";

// const StudyMaterials = ({ user, onLogout }) => {
//   const [currentView, setCurrentView] = useState('dashboard');
//   const [navigationStack, setNavigationStack] = useState([]);
//   const [currentParams, setCurrentParams] = useState({});

//   // Default user if not provided
//   const defaultUser = user || { username: "Student" };
  
//   const handleLogout = onLogout || (() => {
//     console.log("User logged out");
//   });

//   // Navigation functions
//   const navigateTo = (view, params = {}) => {
//     setNavigationStack(prev => [...prev, { view: currentView, params: currentParams }]);
//     setCurrentView(view);
//     setCurrentParams(params);
//   };

//   const navigateBack = () => {
//     if (navigationStack.length > 0) {
//       const previous = navigationStack[navigationStack.length - 1];
//       setNavigationStack(prev => prev.slice(0, -1));
//       setCurrentView(previous.view);
//       setCurrentParams(previous.params);
//     } else {
//       // If no previous view, go back to dashboard
//       setCurrentView('dashboard');
//       setCurrentParams({});
//     }
//   };

//   const goToDashboard = () => {
//     setCurrentView('dashboard');
//     setCurrentParams({});
//     setNavigationStack([]);
//   };

//   // Render current view based on state
//   const renderCurrentView = () => {
//     switch (currentView) {
//       case 'dashboard':
//         return (
//           <Dashboard 
//             user={defaultUser} 
//             onLogout={handleLogout}
//             onNavigate={navigateTo}
//           />
//         );
      
//       case 'subjects':
//         return (
//           <Subjects 
//             user={defaultUser} 
//             onLogout={handleLogout}
//             cycle={currentParams.cycle}
//             type={currentParams.type}
//             onNavigate={navigateTo}
//             onBack={navigateBack}
//           />
//         );
      
//       case 'pdfList':
//         return (
//           <PdfListPage 
//             user={defaultUser} 
//             onLogout={handleLogout}
//             cycle={currentParams.cycle}
//             type={currentParams.type}
//             subjectId={currentParams.subjectId}
//             onNavigate={navigateTo}
//             onBack={navigateBack}
//           />
//         );
      
//       case 'pdfViewer':
//         return (
//           <PdfViewer 
//             user={defaultUser} 
//             onLogout={handleLogout}
//             cycle={currentParams.cycle}
//             subjectId={currentParams.subjectId}
//             type={currentParams.type}
//             pdfId={currentParams.pdfId}
//             onNavigate={navigateTo}
//             onBack={navigateBack}
//           />
//         );
      
//       default:
//         return (
//           <Dashboard 
//             user={defaultUser} 
//             onLogout={handleLogout}
//             onNavigate={navigateTo}
//           />
//         );
//     }
//   };

//   return (
//     <div className="study-materials-container">
//       {/* Simple Navigation */}
//       {navigationStack.length > 0 && (
//         <div className="simple-nav">
//           <button 
//             onClick={navigateBack}
//             className="back-arrow-btn"
//             title="Go Back"
//           >
//             ←
//           </button>
//         </div>
//       )}

//       {/* Current View */}
//       <div className="study-materials-content">
//         {renderCurrentView()}
//       </div>
//     </div>
//   );
// };

// export default StudyMaterials;


import React, { useState } from "react";
import Dashboard from "./Dashboard";
import Subjects from "./Subjects";
import PdfListPage from "./PdfListPage.jsx";
import PdfViewer from "./PdfViewer";
import "./StudyMaterials.css";

const StudyMaterials = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentParams, setCurrentParams] = useState({});

  // Default user if not provided
  const defaultUser = user || { username: "Student" };
  
  const handleLogout = onLogout || (() => {
    console.log("User logged out");
  });

  // Navigation functions
  const navigateTo = (view, params = {}) => {
    setNavigationStack(prev => [...prev, { view: currentView, params: currentParams }]);
    setCurrentView(view);
    setCurrentParams(params);
  };

  const navigateBack = () => {
    if (navigationStack.length > 0) {
      const previous = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentView(previous.view);
      setCurrentParams(previous.params);
    } else {
      // If no previous view, go back to dashboard
      setCurrentView('dashboard');
      setCurrentParams({});
    }
  };

  const goToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentParams({});
    setNavigationStack([]);
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
      {/* Current View */}
      <div className="study-materials-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default StudyMaterials;