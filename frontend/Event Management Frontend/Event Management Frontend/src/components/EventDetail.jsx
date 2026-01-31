import React, { useState } from 'react';
import CommentSection from './CommentSection';

const EventDetail = ({ event, onBack, currentUser, comments, onCommentSubmit, setPage }) => {
  const [showComments, setShowComments] = useState(false);

  if (!event) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px 0' }}>
        <h2>Event not found</h2>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: '1rem' }}>Go back to all events</button>
      </div>
    );
  }

  const handleCommentIconClick = () => {
    if (!currentUser) {
      setPage('login');
    } else {
      setShowComments(s => !s);
    }
  };

  return (
    <div className="container">
        <div className="event-detail-view">
            <button onClick={onBack} className="link-btn" style={{ marginBottom: '1.5rem', fontWeight: '600' }}>← Back to all events</button>
            <img src={event.image} alt={event.title} className="event-detail-view-image" />
            <div className="event-detail-view-content">
                <div className="event-detail-header">
                    <h1>{event.title}</h1>
                    <button onClick={handleCommentIconClick} className="comment-icon-btn" title="View Comments">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
                    </button>
                </div>
                <div className="meta" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <p><strong>Category:</strong> <span className="cat">{event.category}</span></p>
                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {event.time}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                </div>
                <div className="event-detail-description">
                    <h3>About this event</h3>
                    <p>{event.description || 'No description provided.'}</p>
                </div>
                 { (event.email || event.phone) &&
                    <div className="event-detail-contact" style={{ marginTop: '2rem' }}>
                        <h3>Contact Information</h3>
                        {event.email && <p><strong>Email:</strong> {event.email}</p>}
                        {event.phone && <p><strong>Phone:</strong> {event.phone}</p>}
                    </div>
                 }
            </div>
            {showComments && currentUser && (
              <CommentSection
                comments={comments}
                currentUser={currentUser}
                onSubmit={onCommentSubmit}
              />
            )}
        </div>
    </div>
  );
};

export default EventDetail;