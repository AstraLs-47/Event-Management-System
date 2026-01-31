import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = ({ events }) => {
  return (
    <div>
      <h1>All Events</h1>
      {events.length === 0 ? (
        <p>No events available. <Link to="/add-event">Add one!</Link></p>
      ) : (
        <div className="event-list">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <img src={event.image} alt={event.name} className="event-image" />
              <div className="event-card-content">
                <h2>{event.name}</h2>
                <p><strong>Category:</strong> {event.category}</p>
                <Link to={`/event/${event.id}`} className="view-details-btn">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;