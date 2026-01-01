/**
 * Attendify - Attendance Tracking Component (Complete Redesign)
 */

import React, { useState, useEffect } from 'react';
import './AttendanceTracker.css';

const Attendance = ({user}) => {
  const userId = user?.id || user?.uid || user?._id;

  if (!userId) {
    return <p>Please login to view attendance</p>;
  }

  const [subjects, setSubjects] = useState([]);
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'present', 'absent'
  const [markAttendanceFor, setMarkAttendanceFor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyLimits, setHistoryLimits] = useState({}); // Track show more limits per subject

  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
  if (!userId) return;

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/attendance/${userId}`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const records = await res.json();

      const grouped = {};
      records.forEach(rec => {
        if (!grouped[rec.subject]) grouped[rec.subject] = [];
        grouped[rec.subject].push({
          id: rec.id,
          date: rec.date,
          status: rec.status,
        });
      });

      const subjectsData = Object.keys(grouped).map(name => ({
        id: `${name}-${userId}`,
        name,
        attendance: grouped[name],
      }));

      setSubjects(subjectsData);
    } catch (err) {
      console.error("Error loading attendance", err);
    }
  };

  fetchAttendance();
}, [user]);


  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      const normalized = newSubjectName.trim().toLowerCase();
      const exists = subjects.some(s => (s.name || '').trim().toLowerCase() === normalized);
      if (exists) {
        alert('This subject has already been added.');
        return;
      }
      const newSubject = {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        attendance: [] // Array of { date, status }
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
    }
  };
  const handleDeleteAttendance = async (subjectId, recordId) => {
  try {
    await fetch(`http://localhost:5001/api/attendance/record/${recordId}`, {
      method: "DELETE",
      credentials: "include",
    });

    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? {
              ...s,
              attendance: s.attendance.filter(a => a.id !== recordId),
            }
          : s
      )
    );
  } catch (err) {
    console.error("Delete failed", err);
  }
};


  const handleRemoveSubject = async (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    if (!window.confirm('Are you sure you want to remove this subject?')) return;

    try {
      await fetch(
        `http://localhost:5001/api/attendance/subject/${userId}/${encodeURIComponent(subject.name)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      if (showHistoryFor === subjectId) setShowHistoryFor(null);
      if (markAttendanceFor === subjectId) setMarkAttendanceFor(null);
    } catch (err) {
      console.error("Subject delete failed", err);
      alert("Could not delete subject. Please try again.");
    }
  };

 const handleMarkAttendance = async (subjectId, status) => {
  if (!selectedDate) {
    alert("Please select a date");
    return;
  }

  const subject = subjects.find(s => s.id === subjectId);
  if (!subject || !userId) return;

  try {
    const res = await fetch(`http://localhost:5001/api/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
  userId: userId,
  subject: subject.name,
  date: selectedDate,
  status,
  attendance: "regular", // ✅ ADD THIS
}),

    });

    if (!res.ok) throw new Error("Failed");

    const saved = await res.json();

    setSubjects(subjects.map(s =>
      s.id === subjectId
        ? {
            ...s,
            attendance: [
              ...s.attendance,
              { id: saved.id, date: selectedDate, status }
            ]
          }
        : s
    ));
  } catch (err) {
    alert("Error marking attendance");
  }
};

 const handleResetAttendance = async (subjectId) => {
  if (!selectedDate) return;

  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return;

  const toDelete = subject.attendance.filter(a => a.date === selectedDate);

  await Promise.all(
    toDelete.map(a =>
      fetch(`http://localhost:5001/api/attendance/record/${a.id}`, {
        method: "DELETE",
        credentials: "include",
      })
    )
  );

  setSubjects(prev =>
    prev.map(s =>
      s.id === subjectId
        ? { ...s, attendance: s.attendance.filter(a => a.date !== selectedDate) }
        : s
    )
  );
};


  const calculateStats = (attendance) => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, percentage };
  };

  const getFilteredHistory = (attendance) => {
    if (historyFilter === 'present') {
      return attendance.filter(a => a.status === 'present');
    } else if (historyFilter === 'absent') {
      return attendance.filter(a => a.status === 'absent');
    }
    return attendance;
  };

  const getDateStatus = (subjectId, date) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return null;
    const records = subject.attendance.filter(a => a.date === date);
    if (records.length === 0) return null;
    
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    
    return { presentCount, absentCount, total: records.length };
  };

  return (
    <div className="attendance-tracker">
      {/* Header Section */}
      <div className="header-section">
        <div className="title-row">
          <img src="/attend.jpg" alt="Attendance" className="tracker-logo" />
          <h1 className="page-title">Attendance Tracker</h1>
        </div>
        
        {/* Target Attendance & Add Subject Row */}
        <div className="target-add-row">
          <div className="target-input-container">
            <label>Target Attendance:</label>
            <input
              type="number"
              value={targetPercentage}
              onChange={(e) => {
                let value = e.target.value;
                // Remove leading zeros
                value = value.replace(/^0+/, '') || '0';
                const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
                setTargetPercentage(numValue);
              }}
              onInput={(e) => {
                // Prevent leading zeros during typing
                e.target.value = e.target.value.replace(/^0+(\d)/, '$1');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  document.querySelector('.subject-input')?.focus();
                }
              }}
              min="0"
              max="100"
              className="target-input"
            />
            <span className="percentage-symbol">%</span>
          </div>
          
          {/* Subject Percentages Display */}
          {subjects.length > 0 && (
            <div className="subjects-percentages">
              {subjects.map(subject => {
                const stats = calculateStats(subject.attendance);
                const isAbove = stats.percentage >= targetPercentage;
                return (
                  <div key={subject.id} className={`subject-percent-badge ${isAbove ? 'above' : 'below'}`}>
                    <span className="subject-percent-name">{subject.name}:</span>
                    <span className="subject-percent-value">{stats.percentage}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Add Subject Row */}
        <div className="add-subject-container">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
            placeholder="Add new subject"
            className="subject-input"
          />
          <button onClick={handleAddSubject} className="add-btn">
            + Add
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="subjects-list">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects added yet. Start by adding your first subject above!</p>
          </div>
        ) : (
          subjects.map(subject => {
            const stats = calculateStats(subject.attendance);
            const isAboveTarget = stats.percentage >= targetPercentage;
            
            return (
              <div key={subject.id} className="subject-container">
                <div className="subject-header">
                  <h3 className="subject-name">{subject.name}</h3>
                </div>
                
                <div className="subject-stats-row">
                  <span className={`subject-inline-stats ${isAboveTarget ? 'above' : 'below'}`}>
                    {stats.percentage}% | Present: {stats.present} | Absent: {stats.absent} | Total: {stats.total}
                  </span>
                </div>

                <div className="subject-actions">
                  <button
                    onClick={() => {
                      setMarkAttendanceFor(markAttendanceFor === subject.id ? null : subject.id);
                      setShowHistoryFor(null);
                    }}
                    className="mark-attendance-btn"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => {
                      setShowHistoryFor(showHistoryFor === subject.id ? null : subject.id);
                      setMarkAttendanceFor(null);
                    }}
                    className="view-history-btn"
                  >
                    {showHistoryFor === subject.id ? 'Hide History' : 'View History'}
                  </button>
                  <button
                    onClick={() => handleRemoveSubject(subject.id)}
                    className="remove-subject-btn"
                  >
                    Remove
                  </button>
                </div>

                {/* Mark Attendance Section */}
                {markAttendanceFor === subject.id && (
                  <div className="mark-attendance-section">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="date-input"
                    />
                    
                    {selectedDate && (
                      <div className="attendance-buttons-inline">
                        <button
                          onClick={() => handleMarkAttendance(subject.id, 'present')}
                          className="present-btn-small"
                        >
                          ✓ Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(subject.id, 'absent')}
                          className="absent-btn-small"
                        >
                          ✗ Absent
                        </button>
                        <button
                          onClick={() => handleResetAttendance(subject.id)}
                          className="reset-btn-small"
                        >
                          ↻ Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* History Section */}
                {showHistoryFor === subject.id && (
                  <div className="history-overlay">
                    <div className="history-section">
                      <div className="history-header">
                        <h4>Attendance History</h4>
                        <div className="history-filters">
                          <button
                            onClick={() => setHistoryFilter('all')}
                            className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setHistoryFilter('present')}
                            className={`filter-btn ${historyFilter === 'present' ? 'active' : ''}`}
                          >
                            Present Only
                          </button>
                          <button
                            onClick={() => setHistoryFilter('absent')}
                            className={`filter-btn ${historyFilter === 'absent' ? 'active' : ''}`}
                          >
                            Absent Only
                          </button>
                        </div>
                      </div>

                      <div className="history-list">
                        {getFilteredHistory(subject.attendance).length === 0 ? (
                          <p className="no-history">No attendance records found.</p>
                        ) : (
                          <>
                            {getFilteredHistory(subject.attendance)
                              .slice(0, historyLimits[subject.id] || 5)
                              .map((record, index) => (
                                <div key={record.id || index} className="history-item">
                                  <span className={`history-dot ${record.status === 'present' ? 'green' : 'red'}`}></span>
                                  <span className="history-date">{record.date}</span>
                                </div>
                              ))}
                            
                            {getFilteredHistory(subject.attendance).length > (historyLimits[subject.id] || 5) && (
                              <div className="show-more-controls">
                                <span className="show-more-label">Show:</span>
                                {[5, 10, 25, 50, 75, 100].map(limit => (
                                  <button
                                    key={limit}
                                    onClick={() => setHistoryLimits({...historyLimits, [subject.id]: limit})}
                                    className={`show-more-btn ${(historyLimits[subject.id] || 5) === limit ? 'active' : ''}`}
                                  >
                                    {limit}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => setShowHistoryFor(null)}
                        className="history-close-btn"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Attendance;