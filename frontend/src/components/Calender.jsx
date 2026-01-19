import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Calendar.css'

const Calendar = ({ onBack }) => {
  const [events, setEvents] = useState([])
  const [user, setUser] = useState(null)
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: '', 
    type: 'event',
    reminderFrequency: 'daily' // New field for reminder frequency
  })
  const [notification, setNotification] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const API_URL = 'https://acadmate-7z8f.onrender.com/api/reminder'

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (!parsed.id || !parsed.email) {
        alert("User ID or email missing. Please log in again.");
        return;
      }
      setUser(parsed);
    }
  }, []);

  // Fetch events for user
  useEffect(() => {
    if (!user) return;
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/user/${user.id}`);
        const data = Array.isArray(res.data.events) ? res.data.events : [];
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);

  // Fee notifications within 7 days
  useEffect(() => {
    if (!events.length) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const feeEvents = events.filter(e => {
      if (e?.type !== "fee" || !e.date) return false;
      
      const eventDate = new Date(e.date + "T00:00:00");
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return eventDate > today && eventDate <= sevenDaysLater;
    });

    if (feeEvents.length > 0) {
      const daysUntil = Math.ceil(
        (new Date(feeEvents[0].date + "T00:00:00") - today) / (1000 * 60 * 60 * 24)
      );
      setNotification(`⚠️ Fee due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}!`);
      setTimeout(() => setNotification(''), 5000);
    }
  }, [events]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addEvent();
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in both title and date');
      return;
    }

    if (!user?.id || !user?.email) {
      alert('User information missing. Please log in again.');
      return;
    }

    // Validate future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(`${newEvent.date}T00:00:00`);
    
    if (eventDate < today) {
      alert('Please select today or a future date.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/add`, {
        userId: user.id,
        email: user.email,
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type,
        reminderFrequency: newEvent.reminderFrequency, // Include reminder frequency
      });

      setEvents(prev => [...prev, response.data]);
      setNewEvent({ title: '', date: '', type: 'event', reminderFrequency: 'daily' });
      
      const frequencyText = newEvent.reminderFrequency === 'daily' ? 'daily' : 'weekly';
      setNotification(`✅ Event added! You will receive ${frequencyText} reminders.`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      console.error('Failed to add event:', err);
      alert(err.response?.data?.message || 'Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setNotification('🗑️ Event deleted');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const dayEvents = events.filter(event => event.date === dateStr);
      days.push({ day, events: dayEvents });
    }
    
    return days;
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="calendar-container">
      <h2 className="calendar-title">
        <img 
          src={'/calendar.png'} 
          onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src='/logo.png'}} 
          alt="EventBuddy Icon" 
          className="calendar-icon" 
        />
        EventBuddy
      </h2>

      {notification && <div className="notification">{notification}</div>}
      {loading && <div className="loading-indicator">⏳ Loading...</div>}

      <div className="calendar-main-layout">
        {/* Left Side - Add Event Form */}
        <div className="calendar-left-section">
          <div className="event-form-section">
            <h3>Add New Event</h3>
            <div className="event-form">
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="event-title">Event Title</label>
                  <input 
                    id="event-title" 
                    type="text" 
                    placeholder="" 
                    value={newEvent.title} 
                    onChange={(e)=>setNewEvent({...newEvent,title:e.target.value})} 
                    onKeyPress={handleKeyPress} 
                    className="form-input"
                    disabled={loading}
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="event-date">Date</label>
                  <input 
                    id="event-date" 
                    type="date" 
                    value={newEvent.date} 
                    onChange={(e)=>setNewEvent({...newEvent,date:e.target.value})} 
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    disabled={loading}
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="event-type">Type</label>
                  <select 
                    id="event-type" 
                    value={newEvent.type} 
                    onChange={(e)=>setNewEvent({...newEvent,type:e.target.value})} 
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="event">Event</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="fee">Fee Due</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="reminder-frequency">Reminder Frequency</label>
                  <select 
                    id="reminder-frequency" 
                    value={newEvent.reminderFrequency} 
                    onChange={(e)=>setNewEvent({...newEvent,reminderFrequency:e.target.value})} 
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="daily">Daily Reminders</option>
                    <option value="weekly">Weekly Reminders</option>
                  </select>
                </div>
                
                <button 
                  onClick={addEvent} 
                  className="btn btn-add"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Event'}
                </button>
              </div>
              <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                💡 Tip: Events within 7 days automatically get daily reminders regardless of your selection
              </p>
            </div>
          </div>
        </div>

        {/* Middle - Calendar */}
        <div className="calendar-middle-section">
          <div className="calendar-section-wrapper">
            {/* Calendar Navigation */}
            <div className="calendar-nav-section">
              <div className="calendar-nav">
                <button 
                  onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1))} 
                  className="btn nav-btn"
                >
                  ←
                </button>
                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <button 
                  onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1))} 
                  className="btn nav-btn"
                >
                  →
                </button>
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
                        <div key={event.id} className={`event-item ${event.type}`}>
                          {event.title}
                          {event.reminderFrequency === 'weekly' && <span style={{fontSize: '10px'}}> 📅</span>}
                        </div>
                      ))}
                    </>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Upcoming Events */}
        <div className="calendar-right-section">
          <div className="upcoming-events-section">
            <h3>Upcoming Events</h3>
            <div className="events-grid">
              {events
                .filter(event=>new Date(event.date + "T00:00:00")>=new Date())
                .sort((a,b)=>new Date(a.date)-new Date(b.date))
                .slice(0,6)
                .map(event=>{
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const eventDate = new Date(event.date + "T00:00:00");
                  const daysUntil = Math.ceil((eventDate - today) / (1000*60*60*24));
                  const isNear = daysUntil <= 7;
                  
                  return (
                    <div key={event.id} className={`event-card ${event.type}`} style={{position: 'relative', padding: '15px', borderRadius: '10px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <span className="event-type-badge" style={{fontSize: '11px', padding: '3px 10px', borderRadius: '12px'}}>{event.type}</span>
                            <strong className="event-title" style={{fontSize: '16px', color: '#2d3748'}}>{event.title}</strong>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px'}}>
                            <span style={{fontSize: '14px'}}>📅</span>
                            <span className="event-date-badge" style={{fontSize: '13px', color: '#4a5568'}}>
                              {new Date(event.date + "T00:00:00").toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                            </span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {isNear ? (
                              <>
                                <span style={{fontSize: '14px'}}>🔔</span>
                                <span style={{fontSize: '12px', color: '#e53e3e', fontWeight: '600'}}>
                                  Daily reminders (Near event)
                                </span>
                              </>
                            ) : (
                              <>
                                <span style={{fontSize: '14px'}}>📬</span>
                                <span style={{fontSize: '12px', color: '#718096'}}>
                                  {event.reminderFrequency === 'daily' ? 'Daily' : 'Weekly'} reminders
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button 
                          className="event-delete-btn"
                          onClick={() => deleteEvent(event.id)}
                          title="Delete event"
                          disabled={loading}
                          style={{background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '5px', opacity: 0.6, transition: 'opacity 0.2s'}}
                          onMouseEnter={(e) => e.target.style.opacity = 1}
                          onMouseLeave={(e) => e.target.style.opacity = 0.6}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              }
            </div>
            {events.filter(event=>new Date(event.date + "T00:00:00")>=new Date()).length === 0 && (
              <p className="no-events">No upcoming events. Add one above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;