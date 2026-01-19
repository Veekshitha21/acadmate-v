/**
 * Attendify - Attendance Tracking Component (Fixed with Debug Logging)
 */

import React, { useState, useEffect } from 'react';
import './AttendanceTracker.css';
import { attendanceAPI } from "../../services/api";

const Attendance = ({user}) => {
  const userId = user?.id || user?.uid || user?._id;

  if (!userId) {
    return <p>Please login to view attendance</p>;
  }

  const [subjects, setSubjects] = useState([]);
const [targetPercentage, setTargetPercentage] = useState("75");
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [markAttendanceFor, setMarkAttendanceFor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [historyLimits, setHistoryLimits] = useState({});
  const [deleteConfirmFor, setDeleteConfirmFor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Move fetchAttendance outside of useEffect so it can be reused
  const fetchAttendance = async () => {
    if (isLoading) return; // Prevent duplicate calls
    
    setIsLoading(true);
    try {
      
      // Fetch all subjects (including empty ones)
      const summaryRes = await fetch(`https://acadmate-7z8f.onrender.com/api/attendance/${userId}/summary`, {
        credentials: "include",
      });
      
      if (!summaryRes.ok) {
        console.error("❌ Summary fetch failed with status:", summaryRes.status);
        return;
      }
      
      const summary = await summaryRes.json();
      
      // Fetch attendance records
      const recordsRes = await fetch(`https://acadmate-7z8f.onrender.com/api/attendance/${userId}`, {
        credentials: "include",
      });

      if (!recordsRes.ok) {
        console.error("❌ Records fetch failed with status:", recordsRes.status);
        return;
      }

      const records = await recordsRes.json();

      // Group records by subject
      const grouped = {};
      records.forEach(rec => {
        if (!grouped[rec.subject]) grouped[rec.subject] = [];
        grouped[rec.subject].push({
          id: rec.id,
          date: rec.date,
          status: rec.status,
        });
      });

      // Create subjects array from summary (includes empty subjects)
      const subjectsData = summary.map(subjectInfo => ({
        id: `${subjectInfo.subject}-${userId}`,
        name: subjectInfo.subject,
        attendance: grouped[subjectInfo.subject] 
          ? grouped[subjectInfo.subject].sort((a, b) => new Date(b.date) - new Date(a.date))
          : [],
      }));

      // Sort subjects alphabetically to maintain consistent order
      subjectsData.sort((a, b) => a.name.localeCompare(b.name));

      setSubjects(subjectsData);
    } catch (err) {
      console.error("❌ Error loading attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchAttendance();
  }, [userId]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    
    const normalized = newSubjectName.trim().toLowerCase();
    const exists = subjects.some(s => (s.name || '').trim().toLowerCase() === normalized);
    
    if (exists) {
      alert('This subject has already been added.');
      return;
    }

    try {
      const res = await fetch(`https://acadmate-7z8f.onrender.com/api/attendance/subject/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: userId,
          subject: newSubjectName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add subject");

      // Refresh data from server
      await fetchAttendance();
      setNewSubjectName('');
    } catch (err) {
      console.error("Error adding subject:", err);
      alert("Could not add subject. Please try again.");
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) {
      console.error("❌ Subject not found in state:", subjectId);
      return;
    }

    setIsDeleting(true);

    try {
      const url = `https://acadmate-7z8f.onrender.com/attendance/subject/${userId}/${encodeURIComponent(subject.name)}`;
      
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });


      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Delete failed');
      }

      await fetchAttendance();

      setDeleteConfirmFor(null);

    } catch (err) {
      console.error("❌ Delete failed:", err);
      console.error("❌ Error details:", err.message);
      alert(`Could not delete subject: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAttendance = async (subjectId, status) => {
    if (isMarkingAttendance) {
      return;
    }

    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !userId) return;

    setIsMarkingAttendance(true);

    try {
      const res = await fetch(`https://acadmate-7z8f.onrender.com/api/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: userId,
          subject: subject.name,
          date: selectedDate,
          status,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${res.status}`);
      }

      // Optimistically update UI without refetching from server
      const newRecord = {
        id: `${selectedDate}-${status}-${Date.now()}`,
        date: selectedDate,
        status
      };

      setSubjects(prevSubjects => {
        const updated = prevSubjects.map(s =>
          s.id === subjectId
            ? {
                ...s,
                attendance: [newRecord, ...s.attendance].sort((a, b) => 
                  new Date(b.date) - new Date(a.date)
                )
              }
            : s
        );
        // Keep alphabetical order
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert(`Error marking attendance: ${err.message}`);
    } finally {
      // Add a small delay before allowing next request
      setTimeout(() => setIsMarkingAttendance(false), 300);
    }
  };

  const handleResetAttendance = async (subjectId) => {
    if (!selectedDate) {
      alert("Please select a date to reset");
      return;
    }

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const hasRecords = subject.attendance.some(a => a.date === selectedDate);
    if (!hasRecords) {
      alert("No records found for this date");
      return;
    }

    try {
      const res = await fetch(
        `https://acadmate-7z8f.onrender.com/api/attendance/record/${userId}/${encodeURIComponent(subject.name)}/${selectedDate}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to reset");

      // Optimistically update UI
      setSubjects(prevSubjects => {
        const updated = prevSubjects.map(s =>
          s.id === subjectId
            ? { ...s, attendance: s.attendance.filter(a => a.date !== selectedDate) }
            : s
        );
        // Keep alphabetical order
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (err) {
      console.error("Reset failed", err);
      alert("Could not reset attendance. Please try again.");
    }
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
  const value = e.target.value;
  if (/^\d*$/.test(value)) {
    setTargetPercentage(value);
  }
}}
onBlur={() => {
  let val = parseInt(targetPercentage || "0", 10);
  if (val > 100) val = 100;
  if (val < 0) val = 0;
  setTargetPercentage(String(val));
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
                const isAbove = stats.percentage >= Number(targetPercentage);
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
                      setDeleteConfirmFor(null);
                    }}
                    className="mark-attendance-btn"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => {
                      setShowHistoryFor(showHistoryFor === subject.id ? null : subject.id);
                      setMarkAttendanceFor(null);
                      setDeleteConfirmFor(null);
                    }}
                    className="view-history-btn"
                  >
                    {showHistoryFor === subject.id ? 'Hide History' : 'View History'}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmFor(deleteConfirmFor === subject.id ? null : subject.id);
                      setMarkAttendanceFor(null);
                      setShowHistoryFor(null);
                    }}
                    className="remove-subject-btn"
                  >
                    Remove
                  </button>
                </div>

                {/* Delete Confirmation Section */}
                {deleteConfirmFor === subject.id && (
                  <div className="delete-confirmation-section">
                    <div className="delete-warning">
                      <div className="warning-icon">⚠️</div>
                      <div className="warning-text">
                        <strong>Delete "{subject.name}"?</strong>
                        <p>This will permanently delete all {stats.total} attendance records for this subject. This action cannot be undone.</p>
                      </div>
                    </div>
                    <div className="delete-actions">
                      <button
                        onClick={() => handleRemoveSubject(subject.id)}
                        disabled={isDeleting}
                        className="confirm-delete-btn-danger"
                      >
                        {isDeleting ? (
                          <>
                            <span className="spinner"></span>
                            Deleting...
                          </>
                        ) : (
                          <>🗑️ Yes, Delete Permanently</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

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
                          disabled={isMarkingAttendance}
                          className="present-btn-small"
                          style={{ opacity: isMarkingAttendance ? 0.6 : 1 }}
                        >
                          ✓ Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(subject.id, 'absent')}
                          disabled={isMarkingAttendance}
                          className="absent-btn-small"
                          style={{ opacity: isMarkingAttendance ? 0.6 : 1 }}
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
