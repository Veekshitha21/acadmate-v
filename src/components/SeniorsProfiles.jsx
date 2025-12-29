import React, { useState } from 'react';

const styles = `
/* Root CSS Variables */
:root {
  --white: white;
  --beige: #fbf9f1;
  --accent: #f4b30c;
  --black: black;
  --brown: #1a1200;
  --beige-footer: #ddd9c5;
}

/* Main Container */
.seniors-profiles {
  min-height: 100vh;
  background: var(--beige);
  padding: 2rem 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.profiles-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.profiles-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.profiles-header h1 {
  font-size: 3rem;
  color: var(--brown);
  margin-bottom: 1rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.profiles-subtitle {
  font-size: 1.3rem;
  color: var(--brown);
  opacity: 0.8;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Profiles Grid */
.profiles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

/* Flipping Card Container */
.flip-card {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 300px;
  perspective: 1000px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

/* Front and back of card */
.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.flip-card-front {
  background: var(--white);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 1.5rem;
  border: 2px solid transparent;
}

.flip-card-back {
  background: var(--white);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  border: 2px solid var(--accent);
}

/* Profile Header - Front */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
  text-align: left;
}

/* Profile Avatar */
.profile-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--accent);
  box-shadow: 0 4px 12px rgba(244, 179, 12, 0.3);
}

/* Profile Info */
.profile-info {
  flex: 1;
  text-align: left;
}

.profile-name {
  font-size: 1.5rem;
  color: var(--brown);
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.profile-title {
  font-size: 1rem;
  color: var(--accent);
  margin-bottom: 0.2rem;
  font-weight: 600;
}

/* Skills and Branch Section */
.profile-details {
  margin-top: 0;
  text-align: left;
}

.profile-skills {
  margin-bottom: 0.5rem;
}

.profile-skills h4 {
  color: var(--brown);
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
}

.skills-text {
  font-size: 0.85rem;
  color: var(--brown);
  opacity: 0.8;
  line-height: 1.4;
}

.profile-branch {
  margin-bottom: 0;
}

.profile-branch h4 {
  color: var(--brown);
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
}

.branch-text {
  font-size: 0.85rem;
  color: var(--brown);
  opacity: 0.8;
}

/* Back of card - Contact Info */
.contact-info {
  text-align: center;
}

.contact-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brown);
  margin-bottom: 1.5rem;
}

.contact-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 250px;
}

.contact-btn {
  padding: 0.8rem 1.5rem;
  border: 2px solid var(--accent);
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--accent);
  background: transparent;
}

.contact-btn:hover {
  background: var(--accent);
  color: var(--brown);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 179, 12, 0.4);
}

.email-btn:hover {
  background: #007bff;
  border-color: #007bff;
  color: var(--white);
}

.linkedin-btn:hover {
  background: #0077b5;
  border-color: #0077b5;
  color: var(--white);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .profiles-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .seniors-profiles {
    padding: 1rem 0.5rem;
  }
  
  .profiles-header h1 {
    font-size: 2.2rem;
  }
  
  .profiles-subtitle {
    font-size: 1.1rem;
  }
  
  .profiles-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .flip-card {
    min-height: 280px;
  }
  
  .flip-card-inner {
    min-height: 280px;
  }
  
  .flip-card-front {
    padding: 0.8rem;
  }
  
  .flip-card-back {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .profiles-header h1 {
    font-size: 1.8rem;
  }
  
  .flip-card {
    min-height: 260px;
  }
  
  .flip-card-inner {
    min-height: 260px;
  }
  
  .profile-name {
    font-size: 1.3rem;
  }
  
  .avatar-img {
    width: 60px;
    height: 60px;
  }
}

/* Accessibility Improvements */
.contact-btn:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .flip-card-front,
  .flip-card-back {
    border: 2px solid var(--brown);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .flip-card-inner {
    transition: none;
  }
  
  .flip-card:hover .flip-card-inner {
    transform: none;
  }
  
  .contact-btn:hover {
    transform: none;
  }
}
`;

const SeniorsProfiles = () => {
  const [expandedCards, setExpandedCards] = useState(new Set());

  const seniorsData = [
    {
      id: 1,
      name: "Bhaskar",
      title: "Pre final year student",
      experience: "3 years in mentoring juniors and leading college clubs.",
      expertise: ["Literature", "Creative Writing", "Mentoring"],
      skills: "Python, Machine Learning, React.js",
      branch: "Computer Science Engineering",
      bio: "Passionate about helping young minds discover the beauty of literature. Available for mentoring and academic guidance.",
      email: "bhaskarbhaskr09@gmail.com",
      linkedin: "https://www.linkedin.com/in/bhaskara-88aa76322",
      avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFesFldH12gcg/profile-displayphoto-shrink_400_400/B4DZcI1agTGkAg-/0/1748199910403?e=1767830400&v=beta&t=UKAB46aUZb1mnECyBRAIfT9IFDHKYpqpVMnSaqGECFg",
      location: "Mysore",
      availability: "Available for guidance"
    },
    
  ];

  const handleContact = (type, profile) => {
    if (type === 'email') window.open(`mailto:${profile.email}?subject=Hello from ${profile.name}`);
    else if (type === 'linkedin') window.open(profile.linkedin, '_blank');
  };

  const toggleCardExpansion = (cardId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) newExpanded.delete(cardId);
    else newExpanded.add(cardId);
    setExpandedCards(newExpanded);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="seniors-profiles">
        <div className="profiles-grid">
          {seniorsData.map(senior => {
            return (
              <div key={senior.id} className="flip-card">
                <div className="flip-card-inner">
                  {/* Front of the card */}
                  <div className="flip-card-front">
                    <div className="profile-header">
                      <div className="profile-avatar">
                        <img src={senior.avatar} alt={senior.name} className="avatar-img" />
                      </div>
                      <div className="profile-info">
                        <h3 className="profile-name">{senior.name}</h3>
                        <p className="profile-title">{senior.title}</p>
                      </div>
                    </div>

                    <div className="profile-details">
                      <div className="profile-skills">
                        <h4>Skills</h4>
                        <p className="skills-text">{senior.skills}</p>
                      </div>
                      <div className="profile-branch">
                        <h4>Branch</h4>
                        <p className="branch-text">{senior.branch}</p>
                      </div>
                    </div>
                  </div>

                  {/* Back of the card */}
                  <div className="flip-card-back">
                    <div className="contact-info">
                      <h4 className="contact-title">Connect</h4>
                      <div className="contact-buttons">
                        <button
                          className="contact-btn email-btn"
                          onClick={() => handleContact('email', senior)}
                        >
                          📧 Email
                        </button>
                        <button
                          className="contact-btn linkedin-btn"
                          onClick={() => handleContact('linkedin', senior)}
                        >
                          💼 LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SeniorsProfiles;
