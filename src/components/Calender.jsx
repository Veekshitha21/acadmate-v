import React, { useState, useEffect } from "react";
import "./Calendar.css";
import axios from "axios";

const Calendar = ({ onBack }) => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "event" });
  const [notification, setNotification] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState(null);

  // Load logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (!parsed.id) return alert("User ID missing. Please log in again.");
      setUser(parsed);
    }
  }, []);

  // Fetch events for user
  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reminder/user/${user.id}`);
        const data = Array.isArray(res.data.events) ? res.data.events : [];

        // 🧹 Auto-delete past events (before today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureEvents = [];
        for (const event of data) {
          const eventDate = new Date(event.date + "T00:00:00");
          if (eventDate < today) {
            // Delete expired event from backend
            try {
              await axios.delete(`http://localhost:5000/api/reminder/${event.id}`);
              console.log(`Deleted past event: ${event.title}`);
            } catch (err) {
              console.error(`Failed to delete past event ${event.id}:`, err);
            }
          } else {
            futureEvents.push(event);
          }
        }

        setEvents(futureEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setEvents([]);
      }
    };
    fetchEvents();
  }, [user]);

  // Fee notifications within 7 days
  useEffect(() => {
    if (!events.length) return;
    const today = new Date();
    const feeEvents = events.filter(
      (e) =>
        e?.type === "fee" &&
        e.date &&
        new Date(e.date + "T00:00:00") > today &&
        new Date(e.date + "T00:00:00") <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    if (feeEvents.length > 0) {
      setNotification(
        `⚠️ Fee due in ${Math.ceil(
          (new Date(feeEvents[0].date + "T00:00:00") - today) / (1000 * 60 * 60 * 24)
        )} day(s)!`
      );
      const timer = setTimeout(() => setNotification(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [events]);

  // Add new event
  const addEvent = async () => {
    if (!user) return alert("Please log in first!");
    if (!newEvent.title || !newEvent.date) return alert("Please fill all fields");

    try {
      const res = await axios.post("http://localhost:5000/api/reminder/add", {
        userId: user.id,
        email: user.email,
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type,
      });

      if (res.data && res.data.id) {
        setEvents((prev) => [...prev, { id: res.data.id, ...newEvent, isCollege: false }]);
      }
      setNewEvent({ title: "", date: "", type: "event" });
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Failed to add event");
    }
  };

  // Delete event manually
  const deleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/reminder/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete event");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addEvent();
  };

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.date === dateStr);
      days.push({ day, events: dayEvents });
    }
    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!user) return <p>Please login to view your calendar.</p>;

  // Correct upcoming events calculation
  const upcomingEvents = events
    .filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date + "T00:00:00") - new Date(b.date + "T00:00:00"))
    .slice(0, 6);

  return (
    <div className="calendar-container">
      <h2 className="calendar-title">📅 EventBuddy</h2>
      {notification && <div className="notification">{notification}</div>}

      {/* Add Event Form */}
      <div className="event-form-section">
        <h3>Add New Event</h3>
        <div className="event-form">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="event-title">Event Title</label>
              <input
                id="event-title"
                type="text"
                placeholder="Enter event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                onKeyPress={handleKeyPress}
                className="form-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="event-date">Date</label>
              <input
                id="event-date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="event-type">Type</label>
              <select
                id="event-type"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="form-input"
              >
                <option value="event">Event</option>
                <option value="exam">Exam</option>
                <option value="assignment">Assignment</option>
                <option value="fee">Fee Due</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button onClick={addEvent} className="btn btn-add">Add Event</button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav-section">
        <div className="calendar-nav">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="btn nav-btn">←</button>
          <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="btn nav-btn">→</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-section">
        <div className="calendar-grid">
          {weekDays.map((day) => (
            <div key={day} className="calendar-header-day">{day}</div>
          ))}
          {getDaysInMonth(currentMonth).map((day, index) => (
            <div key={index} className={`calendar-day ${day?.events?.length ? "has-event" : ""}`}>
              {day && (
                <>
                  <div className="day-number">{day.day}</div>
                  {day.events.map((event) => (
                    <div key={event.id} className={`event-item ${event.type}`} title="Click to delete" onClick={() => deleteEvent(event.id)}>
                      {event.title}
                      {event.isCollege && <span className="college-badge">📚</span>}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="upcoming-events-section">
        <h3>Upcoming Events</h3>
        <div className="events-grid">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div key={event.id} className={`event-card ${event.type}`}>
                <div className="event-info">
                  <strong>{event.title}</strong>
                  <span className="event-date">{new Date(event.date + "T00:00:00").toLocaleDateString()}</span>
                  {event.isCollege && <span className="college-badge">College Event</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="no-events">No upcoming events 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
