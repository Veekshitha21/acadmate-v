import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AttendanceTracker.css';

const CalendarView = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('attendanceTrackerData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSubjects(parsed.subjects || []);
    }
  }, []);

  // Get calendar data
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get attendance status for a specific date
  const getAttendanceForDate = (date) => {
    if (!date) return { status: 'none', count: 0 };
    
    const dateStr = date.toISOString().split('T')[0];
    const subjectsToCheck = selectedSubject === 'all' 
      ? subjects 
      : subjects.filter(s => s.id === selectedSubject);
    
    let presentCount = 0;
    let absentCount = 0;
    let hasExtra = false;
    
    subjectsToCheck.forEach(subject => {
      const sessionsOnDate = subject.sessions.filter(s => s.date === dateStr);
      sessionsOnDate.forEach(session => {
        if (session.status === 'present') presentCount++;
        else if (session.status === 'absent') absentCount++;
        if (session.isExtra) hasExtra = true;
      });
    });
    
    const totalCount = presentCount + absentCount;
    
    if (totalCount === 0) return { status: 'none', count: 0 };
    if (hasExtra) return { status: 'extra', count: totalCount };
    if (presentCount > 0 && absentCount === 0) return { status: 'present', count: totalCount };
    if (absentCount > 0 && presentCount === 0) return { status: 'absent', count: totalCount };
    return { status: 'mixed', count: totalCount };
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="attendance-tracker">
      {/* Header */}
      <header className="tracker-header">
        <div className="header-content">
          <h1 className="calendar-title">📅 Calendar View</h1>
          <div className="header-actions">
            <button
              className="btn-back"
              onClick={() => navigate('/')}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Section */}
      <section className="calendar-section">
        <div className="calendar-card">
          {/* Subject Filter */}
          <div className="calendar-controls">
            <label className="control-label">Filter by Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="subject-select"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Navigation */}
          <div className="month-navigation">
            <button
              onClick={handlePreviousMonth}
              className="btn-nav"
            >
              ◀
            </button>
            <h2 className="month-title">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={handleNextMonth}
              className="btn-nav"
            >
              ▶
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="weekday-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getCalendarDays().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const { status, count } = getAttendanceForDate(date);
              const todayClass = isToday(date) ? 'today' : '';

              return (
                <div
                  key={index}
                  className={`calendar-day ${status} ${todayClass}`}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {count > 0 && (
                    <span className="day-count">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <h3 className="legend-title">Legend:</h3>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color present"></span>
                <span>Present</span>
              </div>
              <div className="legend-item">
                <span className="legend-color absent"></span>
                <span>Absent</span>
              </div>
              <div className="legend-item">
                <span className="legend-color extra"></span>
                <span>Extra Class</span>
              </div>
              <div className="legend-item">
                <span className="legend-color mixed"></span>
                <span>Mixed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Statistics */}
      <section className="stats-section">
        <h2 className="section-title">📊 Monthly Statistics</h2>
        <div className="stats-grid">
          {subjects.map(subject => {
            // Filter sessions for current month
            const monthSessions = subject.sessions.filter(session => {
              const sessionDate = new Date(session.date);
              return sessionDate.getMonth() === currentDate.getMonth() &&
                     sessionDate.getFullYear() === currentDate.getFullYear();
            });

            const presentCount = monthSessions.filter(s => s.status === 'present').length;
            const totalCount = monthSessions.length;
            const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

            return (
              <div key={subject.id} className="stat-card">
                <h4 className="stat-subject">{subject.name}</h4>
                <div className="stat-details">
                  <div className="stat-row">
                    <span>Total Classes:</span>
                    <span className="stat-value">{totalCount}</span>
                  </div>
                  <div className="stat-row">
                    <span>Present:</span>
                    <span className="stat-value">{presentCount}</span>
                  </div>
                  <div className="stat-row">
                    <span>Attendance:</span>
                    <span className={`stat-value ${percentage >= 75 ? 'good' : 'warning'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default CalendarView;
