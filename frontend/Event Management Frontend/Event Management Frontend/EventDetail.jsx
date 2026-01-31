import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './EventDetail.css';

const EventDetail = ({ events }) => {
  const { id } = useParams();
  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div>
        <h2>Event not found</h2>
        <Link to="/">Go back to Home</Link>
      </div>
    );
  }

  return (
    <div className="event-detail-container">
      <img src={event.image} alt={event.name} className="event-detail-image" />
      <div className="event-detail-content">
        <h1>{event.name}</h1>
        <p className="event-detail-meta"><strong>Category:</strong> {event.category}</p>
        <p className="event-detail-meta"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
        <p className="event-detail-meta"><strong>Time:</strong> {event.time}</p>
        <p className="event-detail-meta"><strong>Location:</strong> {event.location}</p>
        <div className="event-detail-description">
          <h3>About this event</h3>
          <p>{event.description}</p>
        </div>
        <Link to="/" className="back-link">← Back to all events</Link>
      </div>
    </div>
  );
};

export default EventDetail;