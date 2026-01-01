/**
 * Attendify - Attendance Tracking Component (Database Version)
 */

import React, { useState, useEffect, useCallback } from "react";
import "./AttendanceTracker.css";

const AttendanceTracker = ({ onBack, userId }) => {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedDates, setSelectedDates] = useState({});
  const [sessionsDisplayLimit, setSessionsDisplayLimit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  /* ---------------- FETCH DATA ---------------- */

  const fetchDataFromDB = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [subjectsRes, attendanceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/subjects/list/${userId}`),
        fetch(`${API_BASE_URL}/attendance/${userId}`),
      ]);

      if (!subjectsRes.ok)
        throw new Error("Failed to fetch subjects");

      if (!attendanceRes.ok)
        throw new Error("Failed to fetch attendance");

      const subjectNames = await subjectsRes.json();
      const attendanceData = await attendanceRes.json();

      const mappedSubjects = (subjectNames || []).map((name) => ({
        id: `subject_${name}`,
        name,
        showAttendanceForm: false,
        sessions: (attendanceData || [])
          .filter((a) => a.subject === name)
          .map((a) => ({
            id: a._id || `${a.subject}_${a.date}`,
            subject: a.subject,
            date: a.date,
            status: a.status.includes("present")
              ? "present"
              : "absent",
            isExtra: a.status.startsWith("extra"),
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)),
      }));

      setSubjects(mappedSubjects);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId, API_BASE_URL]);

  useEffect(() => {
    fetchDataFromDB();
  }, [fetchDataFromDB]);

  /* ---------------- HELPERS ---------------- */

  const calculateAttendance = (sessions) => {
    if (!sessions.length) return 0;
    const present = sessions.filter((s) => s.status === "present").length;
    return Math.round((present / sessions.length) * 100);
  };

  /* ---------------- SUBJECTS ---------------- */

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    if (
      subjects.some(
        (s) => s.name.toLowerCase() === newSubjectName.toLowerCase()
      )
    ) {
      alert("Subject already exists");
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/attendance/subjects/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subjects: [...subjects.map((s) => s.name), newSubjectName],
        }),
      });

      setNewSubjectName("");
      fetchDataFromDB();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- ATTENDANCE ---------------- */

  const handleMarkAttendance = async (subjectId, status, isExtra) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const date =
      selectedDates[subjectId] ||
      new Date().toISOString().split("T")[0];

    const dbStatus = isExtra ? `extra-${status}` : status;

    try {
      await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subject: subject.name,
          date,
          status: dbStatus,
        }),
      });

      fetchDataFromDB();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- UI ---------------- */

  if (!userId)
    return (
      <p style={{ textAlign: "center" }}>
        Please login to track attendance
      </p>
    );

  if (loading)
    return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (error)
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;

  return (
    <div className="attendance-tracker">
      <h2>Attendify</h2>

      <div className="config-panel">
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="Add Subject"
        />
        <button onClick={handleAddSubject}>Add</button>
      </div>

      <div className="subjects-grid">
        {subjects.map((subject) => {
          const percentage = calculateAttendance(subject.sessions);

          return (
            <div key={subject.id} className="subject-card">
              <h3>{subject.name}</h3>
              <p>Attendance: {percentage}%</p>

              <button
                onClick={() =>
                  setSubjects((prev) =>
                    prev.map((s) =>
                      s.id === subject.id
                        ? {
                            ...s,
                            showAttendanceForm: !s.showAttendanceForm,
                          }
                        : s
                    )
                  )
                }
              >
                Mark Attendance
              </button>

              {subject.showAttendanceForm && (
                <>
                  <input
                    type="date"
                    value={
                      selectedDates[subject.id] ||
                      new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setSelectedDates((p) => ({
                        ...p,
                        [subject.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    onClick={() =>
                      handleMarkAttendance(subject.id, "present", false)
                    }
                  >
                    Present
                  </button>
                  <button
                    onClick={() =>
                      handleMarkAttendance(subject.id, "absent", false)
                    }
                  >
                    Absent
                  </button>
                  <button
                    onClick={() =>
                      handleMarkAttendance(subject.id, "present", true)
                    }
                  >
                    Extra Present
                  </button>
                  <button
                    onClick={() =>
                      handleMarkAttendance(subject.id, "absent", true)
                    }
                  >
                    Extra Absent
                  </button>
                </>
              )}

              {subject.sessions.length > 0 && (
                <div className="sessions-history">
                  <h4>Sessions</h4>

                  {subject.sessions
                    .slice(0, sessionsDisplayLimit[subject.id] || 5)
                    .map((s) => (
                      <div key={s.id} className="session-row">
                        <span>{s.date}</span>
                        <span>{s.status}</span>
                        {s.isExtra && <span>(Extra)</span>}
                      </div>
                    ))}

                  {subject.sessions.length >
                    (sessionsDisplayLimit[subject.id] || 5) && (
                    <button
                      onClick={() =>
                        setSessionsDisplayLimit((p) => ({
                          ...p,
                          [subject.id]:
                            (p[subject.id] || 5) + 5,
                        }))
                      }
                    >
                      Show more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceTracker;