import React, { useState } from 'react';

const EventsList = ({ events, onViewEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event =>
    (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.category && event.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="events">
      <div className="container">
        <h2 style={{ textAlign: 'center', fontSize: '34px', marginBottom: '30px' }}>All Events</h2>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search events by title or category..."
            className="search-input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {events.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No events available.</p>
        ) : filteredEvents.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No events found matching your search.</p>
        ) : (
          <div className="event-card-grid">
            {/* map() renders lists dynamically — each event becomes a DOM element */}
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card-summary">
                <img src={event.image} alt={event.title} className="event-card-summary-image" />
                <div className="event-card-summary-content">
                  <h3>{event.title}</h3>
                  <div className="cat">{event.category}</div>
                  <p className="date">{new Date(event.date).toLocaleDateString()}</p>
                  <button onClick={() => onViewEvent(event.id)} className="btn-primary" style={{ width: '100%', marginTop: 'auto', paddingTop: '10px', paddingBottom: '10px' }}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;