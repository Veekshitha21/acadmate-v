import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Calendar.css'

const Calendar = ({ onBack }) => {
  const [events, setEvents] = useState([
    { id: 1, title: 'Fee Due Date', date: '2025-02-15', type: 'fee', isCollege: true },
    { id: 2, title: 'Mid-term Exams', date: '2025-02-20', type: 'exam', isCollege: true },
    { id: 3, title: 'Sports Day', date: '2025-02-28', type: 'event', isCollege: true }
  ])

  const [user, setUser] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'event' })
  const [notification, setNotification] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
        const res = await axios.get(`http://localhost:5001/api/reminder/user/${user.id}`);
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
              await axios.delete(`http://localhost:5001/api/reminder/${event.id}`);
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
      setNotification(`⚠️ Fee due in ${Math.ceil((new Date(feeEvents[0].date) - today) / (1000 * 60 * 60 * 24))} days!`)
      setTimeout(() => setNotification(''), 5000)
    }
  }, [events])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addEvent()
  }

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    // Disallow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(`${newEvent.date}T00:00:00`);
    if (eventDate < today) {
      alert('Please select today or a future date.');
      return;
    }

    setEvents([...events, { id: Date.now(), ...newEvent, isCollege: false }]);
    setNewEvent({ title: '', date: '', type: 'event' });
  }

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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      const dayEvents = events.filter(event => event.date === dateStr)
      days.push({ day, events: dayEvents })
    }
    return days
  }

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div className="calendar-container">
  <h2 className="calendar-title">
   {/* prefer public asset if available */}
  <img src={'/calendar.png'} onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/logo.png'}} alt="EventBuddy Icon" className="calendar-icon" />
   EventBuddy
  </h2>


      {notification && <div className="notification">{notification}</div>}

      {/* Add Event Form */}
      <div className="event-form-section">
        <h3>Add New Event</h3>
        <div className="event-form">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="event-title">Event Title</label>
              <input id="event-title" type="text" placeholder="Enter event title" 
                value={newEvent.title} onChange={(e)=>setNewEvent({...newEvent,title:e.target.value})} 
                onKeyPress={handleKeyPress} className="form-input" />
            </div>
            <div className="input-group">
              <label htmlFor="event-date">Date</label>
              <input id="event-date" type="date" 
                value={newEvent.date} onChange={(e)=>setNewEvent({...newEvent,date:e.target.value})} 
                className="form-input" />
            </div>
            <div className="input-group">
              <label htmlFor="event-type">Type</label>
              <select id="event-type" value={newEvent.type} 
                onChange={(e)=>setNewEvent({...newEvent,type:e.target.value})} 
                className="form-input">
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
          <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1))} className="btn nav-btn">←</button>
          <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1))} className="btn nav-btn">→</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-section">
        <div className="calendar-grid">
          {weekDays.map(day=><div key={day} className="calendar-header-day">{day}</div>)}
          {getDaysInMonth(currentMonth).map((day,index)=>(
            <div key={index} className={`calendar-day ${day?.events?.length?'has-event':''}`}>
              {day && <>
                <div className="day-number">{day.day}</div>
                {day.events.map(event=>(
                  <div key={event.id} className={`event-item ${event.type}`}>{event.title}{event.isCollege && <span className="college-badge">📚</span>}</div>
                ))}
              </>}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="upcoming-events-section">
        <h3>Upcoming Events</h3>
        <div className="events-grid">
          {events.filter(event=>new Date(event.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,6)
            .map(event=>(
              <div key={event.id} className={`event-card ${event.type}`}>
                <div className="event-info-row">
                  <strong className="event-title">{event.title}</strong>
                  <span className="event-date-badge">{new Date(event.date).toLocaleDateString()}</span>
                  <span className="event-type-badge">{event.type}</span>
                  {event.isCollege && <span className="college-badge">College</span>}
                </div>
                <button 
                  className="event-delete-btn"
                  onClick={() => deleteEvent(event.id)}
                  title="Delete event"
                >
                  🗑️
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default Calendar
