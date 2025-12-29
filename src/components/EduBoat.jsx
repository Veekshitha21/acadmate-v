import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./EduBoat.css";
import { ExamPrepCard } from "./ExamPrep";

const EduBoat = () => {
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");

    const handleScroll = () => {
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100;

        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add("active");
        } else {
          reveals[i].classList.remove("active"); // remove if you want re-trigger
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="eduboat-container">
      {/* Header */}
      <header className="header reveal">
        <h1>EduBoat</h1>
        <p className="subtitle">Study made simple with smart support.</p>
      </header>

      {/* Cards */}
      <div className="card-section">
        <Link to="/examprep" className="reveal" style={{ textDecoration: "none" }}>
          <ExamPrepCard />
        </Link>
      </div>

      {/* Footer */}
      <footer className="footer reveal">
        🎉 Happy learning!
      </footer>
    </div>
  );
};

export default EduBoat;