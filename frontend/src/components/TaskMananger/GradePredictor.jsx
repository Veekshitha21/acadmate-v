/**
 * GradeGenie - Grade Prediction Component
 * 
 * This component provides a comprehensive grade prediction tool.
 */


import React, { useState, useMemo } from 'react';


const GradePredictor = ({ onBack }) => {
  const gradePredictorStyles = `
    :root {
      --white: white;
      --beige: #fbf9f1;
      --accent: #f4b30c;
      --black: black;
      --brown: #1a1200;
      --beige-footer: #ddd9c5;
    }

.grade-predictor-container {
      max-width: 1400px;
      margin: 1rem auto 0 auto;
      padding: 0.5rem 1.5rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .grade-header {
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
    }

    .grade-title {
      margin: 0;
      color: var(--brown);
      font-size: 3rem;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.5px;
    }

    .back-arrow-btn {
      position: fixed;
      top: 80px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: white;
      border: 2px solid var(--accent);
      color: var(--accent);
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(244, 179, 12, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .back-arrow-btn:hover {
      background: var(--accent);
      color: white;
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(244, 179, 12, 0.4);
    }

    .grade-content {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      grid-template-areas:
        "cie results";
      gap: 1.5rem;
      align-items: start;
    }

    /* CIE Input Section */
    .cie-section {
      grid-area: cie;
      background: var(--white);
      padding: 0.85rem;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .cie-section h3 {
      margin: 0 0 0.65rem 0;
      color: var(--brown);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .cie-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.65rem;
      margin-bottom: 0.85rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
    }

    .input-label {
      margin-bottom: 0.35rem;
      color: var(--brown);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .grade-input {
      padding: 0.55rem;
      border: 2px solid var(--beige-footer);
      border-radius: 6px;
      font-size: 0.85rem;
      background: var(--white);
      color: var(--brown);
      transition: all 0.2s ease;
    }

    .grade-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px #f4b30c;
    }

    .grade-icon {
      width: 36px;
      height: 36px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 6px 14px rgba(0,0,0,0.12);
      border: 2px solid rgba(78,205,196,0.12);
      display: inline-block;
      vertical-align: middle;
      margin: 0 0.5rem 0 0;
    }

    @media (max-width: 640px) {
      .grade-icon { width: 28px; height: 28px; }
    }

    .grade-input::placeholder {
      color: var(--beige-footer);
    }

    .cie-summary {
      background: var(--beige);
      padding: 0.7rem;
      border-radius: 8px;
      border-left: 3px solid var(--accent);
    }

    .summary-item {
      margin-bottom: 0.35rem;
      color: var(--brown);
      font-size: 0.8rem;
      font-weight: 500;
    }

    .summary-item:last-child {
      margin-bottom: 0;
    }

    .best-possible {
      font-weight: 600;
      color: var(--accent);
      font-size: 0.85rem;
    }

    /* Results Section */
    .results-section {
      grid-area: results;
      background: var(--white);
      padding: 0.85rem;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      max-height: calc(100vh - 150px);
      overflow-y: auto;
    }

    .results-section h3 {
      margin: 0 0 0.65rem 0;
      color: var(--black);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .grade-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.65rem;
    }

    .grade-card {
      background: var(--beige);
      padding: 0.7rem;
      border-radius: 8px;
      border-left: 3px solid var(--accent);
      transition: all 0.2s ease;
    }

    .grade-card.not-achievable {
      opacity: 0.7;
    }

    .grade-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.55rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--beige-footer);
    }

    .grade-letter {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .grade-range {
      color: var(--brown);
      font-size: 0.7rem;
      font-weight: 500;
    }

    .not-achievable-note {
      background: #fbf9f1;
      color: #f41e1e;
      padding: 0.35rem;
      border-radius: 4px;
      margin-bottom: 0.55rem;
      font-size: 0.7rem;
      text-align: center;
    }

    .grade-details {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .see-requirement strong {
      color: var(--brown);
      font-size: 0.8rem;
    }

    .see-score {
      color: var(--accent);
      font-weight: 600;
      font-size: 0.8rem;
    }

    .see-score-100 {
      color: var(--brown);
      font-size: 0.7rem;
    }

    .see-percentage {
      color: var(--brown);
      font-size: 0.7rem;
      opacity: 0.8;
    }

    .easy-target {
      background: #dcfce7;
      color: #059669;
      padding: 0.35rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .moderate-target {
      background: #fef3c7;
      color: #d97706;
      padding: 0.35rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .hard-target {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.35rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* CGPA Calculator Modal */
    .cgpa-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .cgpa-modal {
      background: var(--white);
      border-radius: 14px;
      padding: 1rem 1.25rem;
      max-width: 480px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
      position: relative;
    }

    .cgpa-close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--beige-footer);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      color: var(--brown);
      transition: all 0.2s ease;
    }

    .cgpa-close-btn:hover {
      background: var(--accent);
      color: white;
      transform: scale(1.1);
    }

    .cgpa-btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(244, 179, 12, 0.3);
    }

    .cgpa-btn:hover {
      background: #d99a0a;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(244, 179, 12, 0.4);
    }

    .cgpa-result {
      background: var(--beige);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      margin-top: 1rem;
      border-left: 4px solid var(--accent);
    }

    .cgpa-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--accent);
      margin: 0.25rem 0;
    }

    .grade-point-info-standalone {
      background: var(--white);
      padding: 0.6rem;
      border-radius: 8px;
      margin-top: 0.85rem;
      border: 1px solid var(--beige-footer);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .grade-point-info-standalone h4 {
      margin: 0 0 0.5rem 0;
      color: var(--brown);
      font-size: 0.8rem;
      font-weight: 600;
    }

    @media (max-width: 1024px) {
      .grade-content {
        grid-template-columns: 1fr;
        grid-template-areas:
          "cie"
          "results"
          "grade-info";
      }
      
      .results-section {
        max-height: none;
      }
      
      .grade-point-info {
        grid-area: grade-info;
        margin-top: 0;
      }
      
      .cie-section .grade-point-info {
        display: none;
      }
      
      .grade-point-info-standalone {
        display: none;
      }
      
      .grade-point-info-mobile {
        display: block;
        grid-area: grade-info;
        background: var(--white);
        padding: 0.6rem;
        border-radius: 8px;
        border: 1px solid var(--beige-footer);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      
      .grade-point-info-mobile h4 {
        margin: 0 0 0.5rem 0;
        color: var(--brown);
        font-size: 0.8rem;
        font-weight: 600;
      }
      
      .grade-point-info-mobile .grade-point-content {
        background: transparent;
        padding: 0;
      }
    }
    
    .grade-point-info-mobile {
      display: none;
    }

    @media (max-width: 768px) {
      .cie-inputs, .grade-results, .tips-grid {
        grid-template-columns: 1fr;
      }

      .grade-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      .grade-title {
        font-size: 1.8rem;
      }
    }
  `;

  const [focusedInput, setFocusedInput] = useState(null);
  const [cie1, setCie1] = useState(0);
  const [cie2, setCie2] = useState(0);
  const [cie3, setCie3] = useState(0);
  const [cie1Warn, setCie1Warn] = useState('');
  const [cie2Warn, setCie2Warn] = useState('');
  const [cie3Warn, setCie3Warn] = useState('');
  const [currentSem, setCurrentSem] = useState(1);
  const [previousSGPAs, setPreviousSGPAs] = useState([]);
  const [showCGPAModal, setShowCGPAModal] = useState(false);
  const [cgpaSemesters, setCgpaSemesters] = useState(1);
  const [cgpaSGPAs, setCgpaSGPAs] = useState([]);
  const [cgpaWarnings, setCgpaWarnings] = useState([]);

  const gradeBands = [
    { grade: 'S', min: 90, max: 100, color: '#f4b30c', gradePoint: 10 },
    { grade: 'A', min: 75, max: 89, color: '#f4b30c', gradePoint: 9 },
    { grade: 'B', min: 66, max: 74, color: '#f4b30c', gradePoint: 8 },
    { grade: 'C', min: 56, max: 65, color: '#f4b30c', gradePoint: 7 },
    { grade: 'D', min: 50, max: 55, color: '#f4b30c', gradePoint: 6 },
    { grade: 'E', min: 45, max: 49, color: '#f4b30c', gradePoint: 5 },
    { grade: 'F', min: 0, max: 44, color: '#f4b30c', gradePoint: 0 }
  ];

  // Lookup table: CIE (out of 40) -> SEE requirements (out of 100) for each grade
  const seeLookupTable = {
    40: { S: 84, A: 59, B: 44, C: 40, D: 'NW', E: 'NW' },
    39: { S: 85, A: 60, B: 45, C: 40, D: 'NW', E: 'NW' },
    38: { S: 87, A: 62, B: 47, C: 40, D: 'NW', E: 'NW' },
    37: { S: 89, A: 64, B: 49, C: 40, D: 'NW', E: 'NW' },
    36: { S: 90, A: 65, B: 50, C: 40, D: 'NW', E: 'NW' },
    35: { S: 92, A: 67, B: 52, C: 40, D: 'NW', E: 'NW' },
    34: { S: 94, A: 69, B: 54, C: 40, D: 'NW', E: 'NW' },
    33: { S: 95, A: 70, B: 55, C: 40, D: 'NW', E: 'NW' },
    32: { S: 97, A: 72, B: 57, C: 40, D: 'NW', E: 'NW' },
    31: { S: 99, A: 74, B: 59, C: 42, D: 40, E: 'NW' },
    30: { S: 100, A: 75, B: 60, C: 44, D: 40, E: 'NW' },
    29: { S: 'NP', A: 77, B: 62, C: 45, D: 40, E: 'NW' },
    28: { S: 'NP', A: 79, B: 64, C: 47, D: 40, E: 'NW' },
    27: { S: 'NP', A: 80, B: 65, C: 49, D: 40, E: 'NW' },
    26: { S: 'NP', A: 82, B: 67, C: 50, D: 40, E: 'NW' },
    25: { S: 'NP', A: 84, B: 69, C: 52, D: 42, E: 40 },
    24: { S: 'NP', A: 85, B: 70, C: 54, D: 44, E: 40 },
    23: { S: 'NP', A: 87, B: 72, C: 55, D: 45, E: 40 },
    22: { S: 'NP', A: 89, B: 74, C: 57, D: 47, E: 40 },
    21: { S: 'NP', A: 90, B: 75, C: 59, D: 49, E: 40 },
    20: { S: 'NP', A: 92, B: 77, C: 60, D: 50, E: 42 }
  };

  const CIE_MIN = 21;
  const SEE_MIN = 40; // Minimum SEE marks out of 100

  const calculations = useMemo(() => {
    const totalCie = (cie1 + cie2 + cie3) * (40 / 80);
    const cieFail = totalCie < CIE_MIN;
    const cieRounded = Math.round(totalCie);

    // Get the lookup row for this CIE score (or closest available)
    const lookupCie = cieRounded >= 40 ? 40 : cieRounded < 20 ? 20 : cieRounded;
    const lookupRow = seeLookupTable[lookupCie] || seeLookupTable[21];

    const results = gradeBands.map(band => {
      // Special handling for F grade
      if (band.grade === 'F') {
        return {
          ...band,
          seeNeeded: null,
          seeNeededOutOf100: null,
          achievable: false,
          fail: true,
          isFGrade: true
        };
      }

      const seeRequired = lookupRow[band.grade];
      
      if (seeRequired === 'NP') {
        return {
          ...band,
          seeNeeded: null,
          seeNeededOutOf100: null,
          achievable: false,
          fail: true,
          notPossible: true
        };
      } else if (seeRequired === 'NW') {
        return {
          ...band,
          seeNeeded: SEE_MIN,
          seeNeededOutOf100: SEE_MIN,
          achievable: true,
          fail: false,
          noWorries: true
        };
      } else {
        const seeNeededOutOf60 = seeRequired * 0.6;
        return {
          ...band,
          seeNeeded: seeNeededOutOf60,
          seeNeededOutOf100: seeRequired,
          achievable: !cieFail && seeRequired <= 100,
          fail: cieFail || seeRequired > 100
        };
      }
    });

    return { totalCie, cieFail, results, cieRounded };
  }, [cie1, cie2, cie3, gradeBands, seeLookupTable]);

  const currentGrade = useMemo(() => {
    if (calculations.cieFail) return 'F';
    for (const band of gradeBands) {
      if (calculations.totalCie + 60 >= band.min) return band.grade;
    }
    return 'F';
  }, [calculations, gradeBands]);

  const currentGradePoint = useMemo(() => {
    const gradeObj = gradeBands.find(b => b.grade === currentGrade);
    return gradeObj ? gradeObj.gradePoint : 0;
  }, [currentGrade, gradeBands]);

  const calculatedCGPA = useMemo(() => {
    if (currentSem === 1) return currentGradePoint;
    const totalSGPA = previousSGPAs.reduce((sum, sgpa) => sum + (parseFloat(sgpa) || 0), 0) + currentGradePoint;
    return (totalSGPA / currentSem).toFixed(2);
  }, [currentSem, previousSGPAs, currentGradePoint]);

  const modalCGPA = useMemo(() => {
    const validSGPAs = cgpaSGPAs.filter(sgpa => sgpa !== '' && !isNaN(parseFloat(sgpa)));
    if (validSGPAs.length === 0) return 0;
    const total = validSGPAs.reduce((sum, sgpa) => sum + parseFloat(sgpa), 0);
    return (total / validSGPAs.length).toFixed(2);
  }, [cgpaSGPAs]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const inputs = ['cie1', 'cie2', 'cie3'];
      const currentIndex = inputs.indexOf(focusedInput);
      if (currentIndex < inputs.length - 1) {
        document.getElementById(inputs[currentIndex + 1])?.focus();
      }
    }
  };

  const handleCgpaKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = document.getElementById(`cgpa-input-${idx + 1}`);
      if (next) next.focus();
    }
  };

  const handleSelectAll = (e) => {
    // Select existing value so users can replace quickly
    e.target.select();
  };

  // Back arrow stays fixed at top; always visible

  return (
    <div className="grade-predictor-container">
      <style>{gradePredictorStyles}</style>

      <div className="grade-header">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', minWidth: '56px' }}>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', paddingLeft: '8px' }}>
            <img
              src="/grade.jpg"
              alt="grade"
              className="grade-icon"
              style={{ marginLeft: 4 }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/grade.jpg';
              }}
            />
            <h2 className="grade-title" style={{ margin: 0, lineHeight: 1, fontSize: 'clamp(1.8rem, 6vw, 3rem)', whiteSpace: 'normal', textAlign: 'center' }}>GradeGenie</h2>
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      <div className="grade-content">
        {/* CIE Input Section */}
        <div className="cie-section">
          <h3>Enter your CIE Marks</h3>
          <div className="cie-inputs">
            {/* CIE 1 (Out of 30) */}
            <div className="input-group">
              <label className="input-label">CIE 1 (Out of 30)</label>
              <input
                type="number"
                id="cie1"
                min="0"
                max="30"
                value={focusedInput === 'cie1' && cie1 === 0 ? '' : cie1}
                onFocus={(e) => { setFocusedInput('cie1'); handleSelectAll(e); }}
                onClick={handleSelectAll}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < 0 || val > 30) {
                    setCie1Warn('Enter a value between 0 and 30');
                  } else {
                    setCie1Warn('');
                    setCie1(val);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="grade-input"
                placeholder="0-30"
              />
              {cie1Warn && (
                <div style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  {cie1Warn}
                </div>
              )}
            </div>

            {/* Event 1 (Out of 20) */}
            <div className="input-group">
              <label className="input-label">Event 1 (Out of 20)</label>
              <input
                type="number"
                id="cie2"
                min="0"
                max="20"
                value={focusedInput === 'cie2' && cie2 === 0 ? '' : cie2}
                onFocus={(e) => { setFocusedInput('cie2'); handleSelectAll(e); }}
                onClick={handleSelectAll}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < 0 || val > 20) {
                    setCie2Warn('Enter a value between 0 and 20');
                  } else {
                    setCie2Warn('');
                    setCie2(val);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="grade-input"
                placeholder="0-20"
              />
              {cie2Warn && (
                <div style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  {cie2Warn}
                </div>
              )}
            </div>

            {/* CIE 2 (Out of 30) */}
            <div className="input-group">
              <label className="input-label">CIE 2 (Out of 30)</label>
              <input
                type="number"
                id="cie3"
                min="0"
                max="30"
                value={focusedInput === 'cie3' && cie3 === 0 ? '' : cie3}
                onFocus={(e) => { setFocusedInput('cie3'); handleSelectAll(e); }}
                onClick={handleSelectAll}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < 0 || val > 30) {
                    setCie3Warn('Enter a value between 0 and 30');
                  } else {
                    setCie3Warn('');
                    setCie3(val);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="grade-input"
                placeholder="0-30"
              />
              {cie3Warn && (
                <div style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  {cie3Warn}
                </div>
              )}
            </div>
          </div>

           <div className="cie-summary">
            <div className="summary-item">Total CIE Raw: {cie1 + cie2 + cie3}/80</div>
            <div className="summary-item">CIE Scaled: {calculations.totalCie.toFixed(1)}/40</div>
            <div className="summary-item best-possible">
              Best Possible Grade: <strong>{currentGrade}</strong>
            </div>
            <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
              <button className="cgpa-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => {
                setShowCGPAModal(true);
                setCgpaSGPAs(Array(cgpaSemesters).fill(''));
              }}>
                 Calculate CGPA
              </button>
            </div>
          </div>

          <div className="grade-point-info-standalone">
            <h4>Grade Point System</h4>
            <div style={{ marginBottom: '0.35rem', color: 'var(--brown)', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <strong>SGPA:</strong> Grade points for this subject (S=10, A=9, B=8, C=7, D=6, E=5, F=0)
            </div>
            <div style={{ color: 'var(--brown)', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <strong>CGPA:</strong> Average of all previous semester SGPAs + current subject SGPA
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          <h3>SEE Requirements for Each Grade</h3>
          <div className="grade-results">
            {calculations.results.map(result => (
              <div
                key={result.grade}
                className={`grade-card ${result.achievable ? '' : 'not-achievable'}`}
                style={{ borderLeftColor: result.color }}
              >
                <div className="grade-header-card">
                  <span className="grade-letter" style={{ color: result.color }}>{result.grade}</span>
                  <span className="grade-range">({result.min}-{result.max}%)</span>
                </div>

                {result.notPossible && <div className="not-achievable-note">❌ Not Possible: Cannot achieve this grade with current CIE marks</div>}
                {result.fail && !result.notPossible && !result.isFGrade && <div className="not-achievable-note">❌ Fail: CIE below minimum required (21/40)</div>}
                {result.isFGrade && <div className="not-achievable-note" style={{ background: '#fee2e2', color: '#991b1b' }}>⚠️ Don't aim for this—study hard and aim higher!</div>}

                <div className="grade-details">
                  {result.noWorries ? (
                    <div className="easy-target">✅ No Worries: Score minimum 40/100 in SEE to get this grade or better!</div>
                  ) : result.achievable ? (
                    <>
                      <div className="see-requirement">
                        <strong>SEE Required:</strong>
                        <span className="see-score"> {result.seeNeededOutOf100}/100</span>
                        <span className="see-score-100"> | {result.seeNeeded.toFixed(1)}/60</span>
                        <span className="see-percentage"> ({result.seeNeededOutOf100}%)</span>
                      </div>
                      {result.seeNeededOutOf100 <= 60 && <div className="easy-target">✅ Easily achievable!</div>}
                      {result.seeNeededOutOf100 > 60 && result.seeNeededOutOf100 <= 80 && <div className="moderate-target">⚠️ Requires good preparation</div>}
                      {result.seeNeededOutOf100 > 80 && <div className="hard-target">🔥 Challenging target</div>}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Point Info for Mobile - shown at bottom */}
        <div className="grade-point-info-mobile">
          <h4>Grade Point System</h4>
          <div className="grade-point-content">
            <div style={{ marginBottom: '0.35rem', color: 'var(--brown)', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <strong>SGPA:</strong> Grade points for this subject (S=10, A=9, B=8, C=7, D=6, E=5, F=0)
            </div>
            <div style={{ color: 'var(--brown)', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <strong>CGPA:</strong> Average of all previous semester SGPAs + current subject SGPA
            </div>
          </div>
        </div>
      </div>

      {/* CGPA Calculator Modal */}
      {showCGPAModal && (
        <div className="cgpa-overlay" onClick={() => setShowCGPAModal(false)}>
          <div className="cgpa-modal" onClick={(e) => e.stopPropagation()}>
            <button className="cgpa-close-btn" onClick={() => setShowCGPAModal(false)}>×</button>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--brown)', fontSize: '1.5rem', fontWeight: 700 }}>CGPA Calculator</h2>
            
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.75rem', display: 'block' }}>How many semesters?</label>
              <select
                value={cgpaSemesters}
                onChange={(e) => {
                  const sems = Number(e.target.value);
                  setCgpaSemesters(sems);
                  setCgpaSGPAs(Array(sems).fill(''));
                }}
                className="grade-input"
                style={{ 
                  cursor: 'pointer', 
                  maxWidth: '150px', 
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>{sem} Semester{sem > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Enter SGPA for each semester</label>
              <div className="cie-inputs" style={{ gap: '0.75rem', marginBottom: '0' }}>
                {Array.from({ length: cgpaSemesters }).map((_, idx) => (
                  <div key={idx} className="input-group">
                    <label className="input-label" style={{ fontSize: '0.85rem' }}>Sem {idx + 1}</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      id={`cgpa-input-${idx}`}
                      value={cgpaSGPAs[idx] || ''}
                      onFocus={handleSelectAll}
                      onClick={handleSelectAll}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          const newSGPAs = [...cgpaSGPAs];
                          newSGPAs[idx] = '';
                          setCgpaSGPAs(newSGPAs);
                          const newWarnings = [...cgpaWarnings];
                          newWarnings[idx] = '';
                          setCgpaWarnings(newWarnings);
                          return;
                        }
                        const num = Number(raw);
                        if (Number.isNaN(num)) return;
                        const bounded = Math.max(0, Math.min(10, num));
                        const newSGPAs = [...cgpaSGPAs];
                        newSGPAs[idx] = bounded.toString();
                        setCgpaSGPAs(newSGPAs);
                        const newWarnings = [...cgpaWarnings];
                        newWarnings[idx] = num > 10 ? 'Enter 0 - 10 only' : '';
                        setCgpaWarnings(newWarnings);
                      }}
                      onKeyDown={(e) => handleCgpaKeyDown(e, idx)}
                      className="grade-input"
                      placeholder="0-10"
                    />
                    {cgpaWarnings[idx] && (
                      <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {cgpaWarnings[idx]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="cgpa-result">
              <div style={{ color: 'var(--brown)', fontSize: '0.8rem', fontWeight: 600 }}>Your CGPA</div>
              <div className="cgpa-value" style={{ fontSize: '1.5rem', margin: '0.2rem 0' }}>{modalCGPA}</div>
              <div style={{ color: 'var(--brown)', fontSize: '0.75rem', opacity: 0.8 }}>out of 10.00</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradePredictor;