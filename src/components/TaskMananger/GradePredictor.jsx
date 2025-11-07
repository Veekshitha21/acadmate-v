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
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
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
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* CIE Input Section */
    .cie-section {
      background: var(--white);
      padding: 1.2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .cie-section h3 {
      margin: 0 0 1rem 0;
      color: var(--brown);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .cie-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
    }

    .input-label {
      margin-bottom: 0.5rem;
      color: var(--brown);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .grade-input {
      padding: 0.8rem;
      border: 2px solid var(--beige-footer);
      border-radius: 6px;
      font-size: 1rem;
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
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
    }

    .summary-item {
      margin-bottom: 0.5rem;
      color: var(--brown);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .summary-item:last-child {
      margin-bottom: 0;
    }

    .best-possible {
      font-weight: 600;
      color: var(--accent);
      font-size: 1rem;
    }

    /* Results Section */
    .results-section {
      background: var(--white);
      padding: 1.2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .results-section h3 {
      margin: 0 0 1rem 0;
      color: var(--black);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .grade-results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .grade-card {
      background: var(--beige);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
      transition: all 0.2s ease;
    }

    .grade-card.not-achievable {
      opacity: 0.7;
    }

    .grade-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--beige-footer);
    }

    .grade-letter {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .grade-range {
      color: var(--brown);
      font-size: 0.8rem;
      font-weight: 500;
    }

    .not-achievable-note {
      background: #fbf9f1;
      color: #f41e1e;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.8rem;
      font-size: 0.8rem;
      text-align: center;
    }

    .grade-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .see-requirement strong {
      color: var(--brown);
      font-size: 0.9rem;
    }

    .see-score {
      color: var(--accent);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .see-score-100 {
      color: var(--brown);
      font-size: 0.8rem;
    }

    .see-percentage {
      color: var(--brown);
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .easy-target {
      background: #dcfce7;
      color: #059669;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .moderate-target {
      background: #fef3c7;
      color: #d97706;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .hard-target {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Tips Section */
    .tips-section {
      background: var(--white);
      padding: 1.2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .tips-section h3 {
      margin: 0 0 1rem 0;
      color: var(--brown);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .tip-card {
      background: var(--beige);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid var(--accent);
      transition: all 0.2s ease;
    }

    .tip-card h4 {
      margin: 0 0 0.5rem 0;
      color: var(--brown);
      font-size: 1rem;
      font-weight: 600;
    }

    .tip-card p {
      margin: 0;
      color: var(--brown);
      font-size: 0.9rem;
      line-height: 1.4;
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

  const gradeBands = [
    { grade: 'S', min: 90, max: 100, color: '#f4b30c' },
    { grade: 'A', min: 75, max: 89, color: '#f4b30c' },
    { grade: 'B', min: 66, max: 74, color: '#f4b30c' },
    { grade: 'C', min: 56, max: 65, color: '#f4b30c' },
    { grade: 'D', min: 50, max: 55, color: '#f4b30c' },
    { grade: 'E', min: 45, max: 49, color: '#f4b30c' },
    { grade: 'F', min: 0, max: 44, color: '#f4b30c' }
  ];

  const CIE_MIN = 21;
  const SEE_MIN = 24;

  const calculations = useMemo(() => {
    const totalCie = (cie1 + cie2 + cie3) * (40 / 80);
    const cieFail = totalCie < CIE_MIN;

    const results = gradeBands.map(band => {
      const seeNeeded = Math.max(0, band.min - totalCie);
      const minSeeRequired = Math.max(seeNeeded, SEE_MIN);
      const seeNeededOutOf100 = (minSeeRequired / 60) * 100;
      const fail = cieFail || minSeeRequired > 60;
      return {
        ...band,
        seeNeeded: Math.min(60, minSeeRequired),
        seeNeededOutOf100: Math.min(100, seeNeededOutOf100),
        achievable: !fail && minSeeRequired <= 60,
        fail
      };
    });

    return { totalCie, cieFail, results };
  }, [cie1, cie2, cie3, gradeBands]);

  const currentGrade = useMemo(() => {
    if (calculations.cieFail) return 'F';
    for (const band of gradeBands) {
      if (calculations.totalCie + 60 >= band.min) return band.grade;
    }
    return 'F';
  }, [calculations, gradeBands]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const inputs = ['cie1', 'cie2', 'cie3'];
      const currentIndex = inputs.indexOf(focusedInput);
      if (currentIndex < inputs.length - 1) {
        document.getElementById(inputs[currentIndex + 1])?.focus();
      }
    }
  };

  // Back arrow stays fixed at top; always visible

  return (
    <div className="grade-predictor-container">
      <style>{gradePredictorStyles}</style>

      <div className="grade-header">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', minWidth: '56px' }}>
            <button
              className="back-arrow-btn"
              onClick={onBack}
              title="Go Back"
              style={{ position: 'static', display: 'flex' }}
            >
              ←
            </button>
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
                onFocus={() => setFocusedInput('cie1')}
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
                onFocus={() => setFocusedInput('cie2')}
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
                onFocus={() => setFocusedInput('cie3')}
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

                {result.fail && <div className="not-achievable-note">❌ Fail: CIE below minimum required (21/40) or impossible SEE requirement</div>}

                <div className="grade-details">
                  <div className="see-requirement">
                    <strong>SEE Required:</strong>
                    <span className="see-score"> {result.seeNeeded.toFixed(1)}/60</span>
                    <span className="see-score-100"> | {result.seeNeededOutOf100.toFixed(1)}/100</span>
                    <span className="see-percentage"> ({result.seeNeededOutOf100.toFixed(1)}%)</span>
                  </div>

                  {result.achievable && result.seeNeeded <= 36 && <div className="easy-target">✅ Easily achievable!</div>}
                  {result.achievable && result.seeNeeded > 36 && result.seeNeeded <= 48 && <div className="moderate-target">⚠️ Requires good preparation</div>}
                  {result.achievable && result.seeNeeded > 48 && <div className="hard-target">🔥 Challenging target</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3>Study Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>📚 For S Grade (90%+)</h4>
              <p>Master all concepts, solve previous years, focus on application-based questions</p>
            </div>
            <div className="tip-card">
              <h4>🎯 For A Grade (80%+)</h4>
              <p>Strong fundamentals, regular practice, cover all important topics thoroughly</p>
            </div>
            <div className="tip-card">
              <h4>📝 For B Grade (70%+)</h4>
              <p>Focus on core concepts, practice standard problems, time management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradePredictor;