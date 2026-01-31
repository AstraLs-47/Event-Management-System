import React from 'react'

export default function HowItWorks(){
  return (
    <section className="how">
      <div className="container">
        <h2>How It Works</h2>
        <p className="muted">Finding and sharing events has never been easier</p>
        <div className="steps">
            <div className="step">
              <div className="icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 21l-4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>1. Browse Events</h4>
              <p>Explore events shared by community members in your area.</p>
            </div>
            <div className="step">
              <div className="icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>2. Search by Category</h4>
              <p>Find events that interest you — Sports, Music, Education.</p>
            </div>
            <div className="step">
              <div className="icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="6" r="2" fill="currentColor"/>
                  <circle cx="6" cy="12" r="2" fill="currentColor"/>
                  <circle cx="18" cy="18" r="2" fill="currentColor"/>
                  <path d="M8.2 11.2L15 7.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.2 12.8L15 16.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>3. Share Your Events</h4>
              <p>Login and share your own events with the community.</p>
            </div>
        </div>
      </div>
    </section>
  )
}
