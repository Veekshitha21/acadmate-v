/**
 * Main Task Manager Application
 * 
 * This is the main application component that manages the task manager module including:
 * - Home page with navigation cards for GradeGenie and Attendify
 * - Grade prediction tool for calculating grades from CIE marks
 * - Attendance tracking system for monitoring class attendance
 * 
 * Features:
 * - Interactive home page with animated cards
 * - Page routing between different tools
 * - Responsive design with modern UI elements
 */

import React, { useState, useEffect } from 'react'

import GradePredictor from './GradePredictor.jsx'
import AttendanceTracker from './Attendance.jsx'



function Task() {
  // State to manage which page is currently being displayed
  const [currentPage, setCurrentPage] = useState('home')
  // App.css styles for the main application
  const appCssStyles = `
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
      --track-radius: 200px;
      --track-offset: 100px;
      --glow-primary: 0 0 20px rgba(244, 179, 12, 0.6);
      --glow-secondary: 0 0 30px rgba(255, 140, 66, 0.4);
    }

    * { 
      box-sizing: border-box; 
    }

    html, body { 
      margin: 0; 
      padding: 0; 
      background: var(--gradient-bg);
      color: var(--brown); 
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; 
      overflow-x: hidden;
    }

    a { 
      color: inherit; 
      text-decoration: none; 
    }

    img { 
      max-width: 100%; 
      display: block; 
    }

    /* Smooth scroll */
    html { 
      scroll-behavior: smooth; 
    }

    .container { 
      width: min(1100px, 92vw); 
      margin-inline: auto; 
    }

    .hero { 
      padding: 64px 0 24px 0; 
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 30% 20%, rgba(244, 179, 12, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 70% 80%, rgba(255, 140, 66, 0.1) 0%, transparent 50%);
      min-height: 100vh;
    }

    .left-half {
      flex: 1;
      animation: slideInFromLeft 1.2s ease-out;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 0 40px 20px;
      min-height: 100vh;
      margin-left: 0;
    }

    .right-half {
      flex: 1;
      display: flex;
      justify-content: center;
      position: relative;
      align-items: center;
      padding-right: 0;
    }

    /* Enhanced Circular Track Animation */
    .track-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 400px;
      position: relative;
      margin-right: 0;
    }

    .cute-tab {
      background: linear-gradient(135deg, var(--white) 0%, #fefefe 100%);
      border: 2px solid var(--accent);
      border-radius: 20px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: var(--shadow-soft);
      position: relative;
      overflow: hidden;
      z-index: 2;
      animation: slideInFromTrack 0.8s ease-out forwards;
      opacity: 0;
      transform: translateX(-100px) rotate(-15deg);
    }

    .cute-tab:hover {
      transform: translateY(-12px) scale(1.05);
      box-shadow: var(--shadow-hover), var(--glow-primary);
      border-color: #ff8c42;
    }

    .tab-icon {
      font-size: 48px;
      margin-bottom: 16px;
      z-index: 2;
      position: relative;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .home-attend-icon {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 10px;
      display: block;
    }

    .cute-tab:hover .tab-icon {
      transform: scale(1.2) rotate(8deg);
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
    }

    .tab-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--brown);
      margin-bottom: 8px;
      z-index: 2;
      position: relative;
      transition: color 0.3s ease;
    }

    .cute-tab:hover .tab-title {
      color: #ff8c42;
    }

    .tab-desc {
      font-size: 14px;
      color: rgba(0,0,0,0.7);
      line-height: 1.4;
      z-index: 2;
      position: relative;
      transition: color 0.3s ease;
    }

    .cute-tab:hover .tab-desc {
      color: var(--brown);
    }

    .title { 
      font-size: clamp(80px, 16vw, 160px); 
      line-height: 0.8; 
      margin: 0 0 40px; 
      position: relative;
      letter-spacing: -0.04em;
      padding-left: 0;
    }

    .title-main {
      color: var(--brown);
      font-weight: 900;
      background: linear-gradient(135deg, var(--brown) 0%, #2a1a00 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titleGlow 3s ease-in-out infinite;
      display: block;
      margin-bottom: 20px;
      text-shadow: 0 8px 16px rgba(0,0,0,0.2);
      transform: scale(1.05);
    }

    .title-sub {
      color: var(--accent);
      font-weight: 700;
      font-size: 0.5em;
      text-shadow: 0 3px 6px rgba(244, 179, 12, 0.4);
      animation: subtitleFloat 4s ease-in-out infinite;
      display: block;
      margin-bottom: 40px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      position: relative;
    }

    .subtitle { 
      color: rgba(0,0,0,0.8); 
      margin: 0 0 40px; 
      font-size: 24px;
      line-height: 1.8;
      position: relative;
      max-width: 600px;
      font-weight: 400;
      letter-spacing: 0.02em;
    }

    /* Enhanced Floating Particles Effect */
    .floating-particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .particle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      animation: float 8s ease-in-out infinite;
      box-shadow: 0 0 10px rgba(244, 179, 12, 0.6);
    }

    /* Animated Background Elements */
    .animated-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .bg-circle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(244, 179, 12, 0.1) 0%, transparent 70%);
      animation: bgFloat 20s ease-in-out infinite;
    }

    /* Enhanced Decorative Elements */
    .decorative-elements {
      display: flex;
      align-items: center;
      gap: 25px;
      margin-top: 50px;
      position: relative;
    }

    .decor-dot {
      width: 16px;
      height: 16px;
      background: var(--accent);
      border-radius: 50%;
      animation: decorPulse 2s ease-in-out infinite;
      box-shadow: 0 0 20px rgba(244, 179, 12, 0.5);
    }

    .decor-line {
      width: 80px;
      height: 4px;
      background: var(--gradient-primary);
      border-radius: 3px;
      animation: decorLine 3s ease-in-out infinite;
      position: relative;
    }

    /* Keyframes for animations */
    @keyframes slideInFromLeft {
      0% {
        opacity: 0;
        transform: translateX(-50px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInFromTrack {
      0% {
        opacity: 0;
        transform: translateX(-100px) rotate(-15deg) scale(0.8);
      }
      50% {
        opacity: 0.7;
        transform: translateX(-50px) rotate(-7deg) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translateX(0) rotate(0deg) scale(1);
      }
    }

    @keyframes titleGlow {
      0%, 100% { 
        filter: drop-shadow(0 0 8px rgba(244, 179, 12, 0.4));
      }
      50% { 
        filter: drop-shadow(0 0 25px rgba(244, 179, 12, 0.8));
      }
    }

    @keyframes subtitleFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px) rotate(0deg) scale(1);
        opacity: 0.7;
        box-shadow: 0 0 10px rgba(244, 179, 12, 0.6);
      }
      25% {
        transform: translateY(-15px) rotate(90deg) scale(1.1);
        opacity: 1;
        box-shadow: 0 0 20px rgba(244, 179, 12, 0.8);
      }
      50% {
        transform: translateY(-25px) rotate(180deg) scale(1.2);
        opacity: 0.9;
        box-shadow: 0 0 25px rgba(244, 179, 12, 1);
      }
      75% {
        transform: translateY(-15px) rotate(270deg) scale(1.1);
        opacity: 1;
        box-shadow: 0 0 20px rgba(244, 179, 12, 0.8);
      }
    }

    @keyframes bgFloat {
      0%, 100% {
        transform: translateY(0px) scale(1);
        opacity: 0.3;
      }
      50% {
        transform: translateY(-30px) scale(1.1);
        opacity: 0.6;
      }
    }

    @keyframes decorPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.7;
        box-shadow: 0 0 20px rgba(244, 179, 12, 0.5);
      }
      50% {
        transform: scale(1.5);
        opacity: 1;
        box-shadow: 0 0 30px rgba(244, 179, 12, 0.9);
      }
    }

    @keyframes decorLine {
      0%, 100% {
        transform: scaleX(1);
        opacity: 0.6;
      }
      50% {
        transform: scaleX(2);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        text-align: center;
        gap: 32px;
        min-height: auto;
        padding: 40px 20px;
      }
      
      .left-half {
        flex: none;
        width: 100%;
        min-height: auto;
        padding: 20px 0;
      }
      
      .title {
        font-size: clamp(64px, 16vw, 120px);
        text-align: center;
      }
      
      .title-sub {
        text-align: center;
      }
      
      .subtitle {
        text-align: center;
        max-width: 100%;
      }
      
      .decorative-elements {
        justify-content: center;
      }
      
      .right-half {
        flex: none;
        width: 100%;
      }
      
      .track-container {
        max-width: 100%;
      }
    }
  `

  // styles.css for general page layout and components
  const stylesCssStyles = `
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--white);
      border-radius: 12px;
      box-shadow: 0 2px 8px #f4b30c;
    }

    .grade-title {
      margin: 0;
      color: var(--brown);
      font-size: 1.5rem;
      font-weight: 700;
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
`
  useEffect(() => {
    const styleTag = document.createElement('style')
    styleTag.innerHTML = appCssStyles + stylesCssStyles
    document.head.appendChild(styleTag)

    // cleanup on unmount
    return () => {
      document.head.removeChild(styleTag)
    }
  }, [])

  // Push history state for internal Task navigation and handle browser back/forward
  useEffect(() => {
    try {
      window.history.pushState({ taskPage: currentPage }, '', `#Task-${currentPage}`)
    } catch {}
  }, [currentPage])

  useEffect(() => {
    const onPopTask = (e) => {
      const page = (e.state && e.state.taskPage) || 'home'
      setCurrentPage(page)
    }
    window.addEventListener('popstate', onPopTask)
    return () => window.removeEventListener('popstate', onPopTask)
  }, [])

  /**
   * HomePage Component
   * 
   * Renders the main landing page with:
   * - Animated background with floating particles and circles
   * - Hero section with title and description
   * - Interactive navigation cards for different tools
   * - Modern UI with hover effects and animations
   */
  const HomePage = () => (
    <div className="container hero">
      {/* Enhanced Floating Particles - Creates dynamic background animation */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle particle-small"></div>
        <div className="particle particle-small"></div>
        <div className="particle particle-small"></div>
      </div>
      
      {/* Animated Background Elements - Decorative circles for visual appeal */}
      <div className="animated-bg">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>
      
      {/* Left Half - Hero Content Section */}
      <div className="left-half">
        <h1 className="title">
          <span className="title-main">A NEW WAY<br />TO MANAGE</span>
          <span className="title-sub">College Life</span>
        </h1>
        <p className="subtitle">
          Your complete digital companion for academic success and event planning. 
          Track attendance, predict grades, and never miss important events again.
        </p>
        
        {/* Decorative Elements - Visual enhancement dots and lines */}
        <div className="decorative-elements">
          <div className="decor-dot"></div>
          <div className="decor-line"></div>
          <div className="decor-dot"></div>
        </div>
      </div>
      
      {/* Right Half - Navigation Cards Section */}
      <div className="right-half">
        {/* Enhanced Track Path Animation - Background track for cards */}
        <div className="track-path"></div>
        <div className="track-path track-path-secondary"></div>
        
        <div className="track-container">
          {/* GradeGenie Card - Navigate to grade prediction tool */}
          <div className="cute-tab tab1" onClick={() => setCurrentPage('grades')}>
            <div className="tab-icon grade-icon">🎓</div>
            <div className="tab-title">GradeGenie</div>
            <div className="tab-desc">Calculate grades from CIE marks instantly</div>
            <div className="tab-glow"></div>
          </div>
          
          {/* Attendify Card - Navigate to attendance tracking tool */}
          <div className="cute-tab tab2" onClick={() => setCurrentPage('attendance')}>
            <div className="tab-icon attendance-icon"><img src={'/attend.jpg'} alt="Attend" className="home-attend-icon" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/attend.jpg'}}/></div>
            <div className="tab-title">Attendify</div>
            <div className="tab-desc">Track your class attendance percentage</div>
            <div className="tab-glow"></div>
          </div>
        </div>
      </div>
    </div>
  )


  /**
   * Main Render Function
   * 
   * Conditionally renders different pages based on currentPage state:
   * - 'home': Shows the HomePage component with navigation cards
   * - 'grades': Shows the GradePredictor component
   * - 'attendance': Shows the Attendance component
   */
  return (
    <>
      {/* Render HomePage when currentPage is 'home' */}
      {currentPage === 'home' && <HomePage />}
      
      {/* Render specific tools when not on home page */}
      {currentPage !== 'home' && (
        <>
          {/* Grade Prediction Tool - Calculate grades from CIE marks */}
          {currentPage === 'grades' && <GradePredictor onBack={() => setCurrentPage('home')} />}
          {/* Attendance Tracking Tool - Monitor class attendance */}
          {currentPage === 'attendance' && <AttendanceTracker onBack={() => setCurrentPage('home')} />}
        </>
      )}
    </>
  )
}

export default Task;