/**
 * Attendify - Attendance Tracking Component
 */

import React, { useState, useEffect } from 'react';
import './AttendanceTracker.css';

const AttendanceTracker = ({ onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [selectedDates, setSelectedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSubjectForCalendar, setSelectedSubjectForCalendar] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const savedData = localStorage.getItem('attendanceTrackerData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSubjects(parsed.subjects || []);
      setTargetPercentage(parsed.targetPercentage || 75);
    }
  }, []);

  // By default, do not auto-select subject; calendar remains empty until user selects

  useEffect(() => {
    const dataToSave = { subjects, targetPercentage };
    localStorage.setItem('attendanceTrackerData', JSON.stringify(dataToSave));
  }, [subjects, targetPercentage]);

  const saveToUndoStack = () => {
    setUndoStack(prev => [...prev, { subjects: JSON.parse(JSON.stringify(subjects)), targetPercentage }]);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setSubjects(lastState.subjects);
      setTargetPercentage(lastState.targetPercentage);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      saveToUndoStack();
      const newSubject = {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        sessions: [],
        showAttendanceForm: false,
        showSessions: false
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
    }
  };

  const handleRemoveSubject = (subjectId) => {
    saveToUndoStack();
    setSubjects(subjects.filter(s => s.id !== subjectId));
  };

  const handleMarkAttendance = (subjectId, status, isExtra = false) => {
    saveToUndoStack();
    const date = selectedDates[subjectId] || new Date().toISOString().split('T')[0];

    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        if (isExtra) {
          const newSession = {
            id: Date.now().toString() + Math.random(),
            date,
            status,
            isExtra: true
          };
          return {
            ...subject,
            sessions: [...subject.sessions, newSession].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
        } else {
          const existingRegularIndex = subject.sessions.findIndex(s => s.date === date && !s.isExtra);
          if (existingRegularIndex >= 0) {
            const updatedSessions = [...subject.sessions];
            updatedSessions[existingRegularIndex] = { ...updatedSessions[existingRegularIndex], status };
            return { ...subject, sessions: updatedSessions };
          } else {
            const newSession = {
              id: Date.now().toString() + Math.random(),
              date,
              status,
              isExtra: false
            };
            return {
              ...subject,
              sessions: [...subject.sessions, newSession].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
          }
        }
      }
      return subject;
    }));
  };

  const handleDeleteSession = (subjectId, sessionId) => {
    saveToUndoStack();
    setSubjects(subjects.map(subject => {
      if (subject.id === subjectId) {
        return { ...subject, sessions: subject.sessions.filter(s => s.id !== sessionId) };
      }
      return subject;
    }));
  };

  const toggleAttendanceForm = (subjectId) => {
    setSubjects(subjects.map(subject => subject.id === subjectId ? { ...subject, showAttendanceForm: !subject.showAttendanceForm } : subject));
  };

  const toggleShowSessions = (subjectId) => {
    setSubjects(subjects.map(subject => subject.id === subjectId ? { ...subject, showSessions: !subject.showSessions } : subject));
  };

  const calculateAttendance = (sessions) => {
    if (sessions.length === 0) return 0;
    const presentCount = sessions.filter(s => s.status === 'present').length;
    return Math.round((presentCount / sessions.length) * 100);
    };

  const getStatusClass = (percentage) => {
    if (percentage >= targetPercentage) return 'status-good';
    return 'status-warning';
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);
  const toLocalDateString = (y, m, d) => `${y}-${fmt(m + 1)}-${fmt(d)}`; // m is 0-based
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getDayStatusForSubject = (day) => {
    if (!selectedSubjectForCalendar) return null;
    // Use local YYYY-MM-DD to match input[type=date] values and stored session dates
    const dateStr = toLocalDateString(currentYear, currentMonth, day);
    const subj = subjects.find(s => s.id === selectedSubjectForCalendar);
    if (!subj) return null;
    const daySessions = subj.sessions.filter(s => s.date === dateStr);
    if (daySessions.length === 0) return null;
    const hasPresent = daySessions.some(s => s.status === 'present');
    const hasAbsent = daySessions.some(s => s.status === 'absent');
    const hasOnlyExtra = daySessions.every(s => s.isExtra);
    if (hasPresent && hasAbsent) return 'mixed';
    if (hasOnlyExtra) return 'extra';
    return hasPresent ? 'present' : 'absent';
  };

  return (
    <div className="attendance-tracker">
      <header className="tracker-header">
        <div className="grade-header" style={{ width: 'min(1100px, 92vw)', margin: '0 auto 1.5rem', padding: '1rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', minWidth: '56px' }}>
              <button
                className="back-arrow-btn"
                onClick={() => (onBack ? onBack() : window.history.back())}
                title="Go Back"
                style={{ position: 'static', display: 'flex', width: 40, height: 40, marginRight: 8 }}
              >
                ←
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', paddingLeft: '8px', minWidth: 0 }}>
              <img src={'/attend.jpg'} alt="Attendance" className="title-logo" style={{ marginLeft: 8 }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/attend.jpg'; }} />
              <h3 className="grade-title" style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(1.8rem, 6vw, 3rem)', lineHeight: 1, whiteSpace: 'nowrap' }}>Attendify</h3>
            </div>
            <div style={{ flex: 1 }} />
          </div>
        </div>
        <div className="header-actions" style={{ justifyContent: 'center', margin: '0 auto', width: 'min(1100px, 92vw)' }}>
          <button className="btn-calendar" onClick={() => setShowCalendar(v => !v)}>
            {showCalendar ? '▲ Hide Calendar' : '📅 Calendar View'}
          </button>
          {undoStack.length > 0 && (
            <button className="btn-undo" onClick={handleUndo}>↶ Undo</button>
          )}
        </div>
      </header>

      <div style={{ width: 'min(1100px, 92vw)', margin: '0 auto' }}>
      <section className="config-panel">
        <div className="config-content">
          <div className="config-item">
            <label className="config-label">Target Attendance %</label>
            <input type="number" className="config-input" value={targetPercentage} onChange={(e) => setTargetPercentage(Number(e.target.value))} min="0" max="100" />
          </div>

          <div className="config-item">
            <label className="config-label">Add Subject</label>
            <div className="add-subject-group">
              <input type="text" className="config-input" placeholder="Subject name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()} />
              <button className="btn-add" onClick={handleAddSubject}>+ Add</button>
            </div>
          </div>

          {subjects.length > 0 && (
            <div className="config-item">
              <label className="config-label">Subjects ({subjects.length})</label>
              <div className="subjects-list">
                {subjects.map(subject => (
                  <div key={subject.id} className="subject-tag">
                    <span>{subject.name}</span>
                    <button className="btn-remove-tag" onClick={() => handleRemoveSubject(subject.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      </div>

      {showCalendar && (
        <section className="calendar-grid-section">
          <div className="calendar-controls">
            <div className="controls-content">
              <div className="control-group">
                <label className="control-label">Subject</label>
                <select
                  className="subject-select"
                  value={selectedSubjectForCalendar}
                  onChange={(e) => setSelectedSubjectForCalendar(e.target.value)}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label className="control-label">Month</label>
                <div className="month-navigation">
                  <button className="btn-nav" onClick={() => navigateMonth('prev')}>‹ Prev</button>
                  <div className="current-month">
                    {new Date(currentYear, currentMonth).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                  </div>
                  <button className="btn-nav" onClick={() => navigateMonth('next')}>Next ›</button>
                </div>
              </div>
            </div>
          </div>

          {selectedSubjectForCalendar && (
            <>
              <div className="calendar-legend">
                <div className="legend-content">
                  <div className="legend-title">Legend</div>
                  <div className="legend-items">
                    <div className="legend-item"><div className="legend-color legend-present"></div><span className="legend-text">Present</span></div>
                    <div className="legend-item"><div className="legend-color legend-absent"></div><span className="legend-text">Absent</span></div>
                    <div className="legend-item"><div className="legend-color legend-extra"></div><span className="legend-text">Extra</span></div>
                    <div className="legend-item"><div className="legend-color legend-mixed"></div><span className="legend-text">Mixed</span></div>
                  </div>
                </div>
              </div>

              <div className="calendar-container">
                <div className="calendar-weekdays">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <div key={d} className="weekday">{d}</div>
                  ))}
                </div>
                <div className="calendar-grid">
                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty" />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, idx) => {
                    const day = idx + 1;
                    const status = getDayStatusForSubject(day);
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                    const classes = ['calendar-day'];
                    if (status) classes.push(status);
                    if (isToday) classes.push('today');
                    return (
                      <div key={day} className={classes.join(' ')}>
                        <div className="day-number">{day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <section className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects added yet. Add your first subject to start tracking attendance!</p>
          </div>
        ) : (
          subjects.map(subject => {
            const percentage = calculateAttendance(subject.sessions);
            const statusClass = getStatusClass(percentage);

            return (
              <div key={subject.id} className="subject-card">
                <div className="card-header">
                  <h3 className="card-title">{subject.name}</h3>
                  <div className={`attendance-badge ${statusClass}`}>
                    {percentage}%
                  </div>
                </div>

                <div className="card-stats">
                  <span className="stat-item">Total Classes: {subject.sessions.length}</span>
                  <span className="stat-item">Present: {subject.sessions.filter(s => s.status === 'present').length}</span>
                  <span className="stat-item">Extra Classes: {subject.sessions.filter(s => s.isExtra).length}</span>
                </div>

                <button className="btn-toggle-form" onClick={() => toggleAttendanceForm(subject.id)}>
                  {subject.showAttendanceForm ? '▲ Hide Attendance Form' : '▼ Mark Attendance'}
                </button>

                {subject.showAttendanceForm && (
                  <div className="card-actions">
                    <input type="date" className="date-input" value={selectedDates[subject.id] || new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDates({ ...selectedDates, [subject.id]: e.target.value })} />

                    <div className="attendance-section">
                      <label className="section-label">Regular Attendance</label>
                      <div className="action-buttons-regular">
                        <button className="btn-present" onClick={() => handleMarkAttendance(subject.id, 'present', false)}>✓ Present</button>
                        <button className="btn-absent" onClick={() => handleMarkAttendance(subject.id, 'absent', false)}>✗ Absent</button>
                      </div>
                    </div>

                    <div className="attendance-section">
                      <label className="section-label">Extra Class</label>
                      <div className="action-buttons-extra">
                        <button className="btn-extra-present" onClick={() => handleMarkAttendance(subject.id, 'present', true)}>+ Extra (Present)</button>
                        <button className="btn-extra-absent" onClick={() => handleMarkAttendance(subject.id, 'absent', true)}>+ Extra (Absent)</button>
                      </div>
                    </div>
                  </div>
                )}

                {subject.sessions.length > 0 && (
                  <div className="sessions-history">
                    <div className="history-header">
                      <h4 className="history-title">All Sessions ({subject.sessions.length})</h4>
                      <button className="btn-toggle-sessions" onClick={() => toggleShowSessions(subject.id)}>
                        {subject.showSessions ? '▲ Hide' : '▼ Show'}
                      </button>
                    </div>
                    {subject.showSessions && (
                      <div className="sessions-list">
                        {subject.sessions.map((session) => (
                          <div key={session.id} className="session-item">
                            <span className="session-date">{session.date}</span>
                            <span className={`session-status status-${session.status}`}>
                              {session.isExtra && '⭐ Extra - '}
                              {session.status === 'present' ? '✓ Present' : '✗ Absent'}
                            </span>
                            <button className="btn-delete-session" onClick={() => handleDeleteSession(subject.id, session.id)} title="Delete session">🗑</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default AttendanceTracker;