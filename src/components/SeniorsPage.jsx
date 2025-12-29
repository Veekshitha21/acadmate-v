/**
 * Senior Contact Page Component
 * 
 * This page component serves as the main wrapper for the Senior Care contact application.
 * It provides:
 * - Header with title
 * - Back button (updates active section)
 * - Integration with the SeniorsProfiles component
 */

import React from 'react';
import SeniorsProfiles from './SeniorsProfiles.jsx';

const styles = `
:root {
	--white: white;
	--beige: #fbf9f1;
	--accent: #f4b30c;
	--black: black;
	--brown: #1a1200;
	--beige-footer: #ddd9c5;
	--gradient-primary: linear-gradient(135deg, #f4b30c 0%, #ff8c42 100%);
	--gradient-bg: linear-gradient(135deg, #fbf9f1 0%, #f0ede1 50%, #e8e3d3 100%);
	--shadow-soft: 0 8px 32px rgba(244, 179, 12, 0.1);
	--shadow-hover: 0 16px 48px rgba(244, 179, 12, 0.2);
}

* { box-sizing: border-box; }
html, body { 
	margin: 0; 
	padding: 0; 
	background: var(--gradient-bg);
	color: var(--brown); 
	font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; 
	overflow-x: hidden;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

/* Smooth scroll */
html { scroll-behavior: smooth; }

.container { width: min(1100px, 92vw); margin-inline: auto; }
.hero { padding: 64px 0 24px; }
.title { font-size: clamp(32px, 6vw, 60px); line-height: 1.05; margin: 0 0 12px; }
.subtitle { color: rgba(0,0,0,0.7); margin: 0 0 18px; }
.grid-3 { display: grid; grid-template-columns: 1fr; gap: 14px; }
.card { background: var(--white); border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 16px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.12); background: var(--white); color: var(--brown); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.btn--accent { background: var(--accent); border-color: var(--accent); }
.options { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 18px; }
.option { display: flex; flex-direction: column; align-items: flex-start; padding: 20px; border-radius: 14px; background: var(--white); border: 1px solid rgba(0,0,0,0.08); cursor: pointer; transition: all 0.2s; }
.option:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }
.option-title { font-weight: 700; margin-bottom: 8px; }
.option-desc { color: rgba(0,0,0,0.7); font-size: 14px; }
.back { margin-top: 18px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-weight: 600; margin-bottom: 6px; }
.form-input { width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; font-size: 14px; }
.form-input:focus { outline: none; border-color: var(--accent); }
.grade-result { padding: 12px; margin: 8px 0; border-radius: 8px; background: var(--white); border: 1px solid rgba(0,0,0,0.08); }
.grade-letter { font-weight: 700; font-size: 18px; color: var(--accent); }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin: 16px 0; }
.calendar-day { padding: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.08); min-height: 40px; }
.calendar-day.has-event { background: rgba(244, 179, 12, 0.1); }
.event-item { padding: 8px; margin: 4px 0; background: var(--white); border-radius: 6px; border-left: 4px solid var(--accent); font-size: 12px; }
.notification { position: fixed; top: 20px; right: 20px; background: var(--accent); color: var(--brown); padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
@media (min-width: 768px) { .grid-3 { grid-template-columns: repeat(3, 1fr); } .options { grid-template-columns: repeat(3, 1fr); } }

/* Page Layout Styles */
.page-layout {
  min-height: 100vh;
  background: var(--beige);
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--brown);
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  color: rgba(26, 18, 0, 0.7);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.grade-header {
  margin-bottom: 2rem;
}

.grade-title {
  margin: 0 auto;
  color: var(--brown);
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  display: block;
  width: 100%;
}

.back-button-container {
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.back-btn {
  background: var(--white);
  border: 1px solid rgba(0,0,0,0.12);
  color: var(--brown);
  font-weight: 600;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background: var(--accent);
  border-color: var(--accent);
  color: var(--brown);
}
`;

const SeniorsPage = ({ onBackToHome }) => {

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="page-layout min-h-screen custom-beige">
      <div className="max-w-7xl mx-auto px-4 py-10 page-container">
        {/* Header with title */}
        <h2 className="grade-title">🎓 Meet Our Senior Mentors</h2>

        {/* Main content area */}
        <div className="page-content">
          <SeniorsProfiles />
        </div>
      </div>
    </div>
    </>
  );
};

export default SeniorsPage;
