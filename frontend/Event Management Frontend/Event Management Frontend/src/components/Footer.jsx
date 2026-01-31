import React from 'react'

export default function Footer({ setPage }){
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <h4>Event Hub</h4>
          <p className="muted">A community platform where people discover and share events happening around them.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul className="links">
            <li><button type="button" className="link-btn" onClick={() => setPage && setPage('home')}>Home</button></li>
            <li><button type="button" className="link-btn" onClick={() => setPage && setPage('events')}>Events</button></li>
            <li><button type="button" className="link-btn" onClick={() => setPage && setPage('about')}>About</button></li>
          </ul>
        </div>
        <div>
          <h4>Connect With Us</h4>
          <p className="muted">Share events, discover activities, and be part of a vibrant community.</p>
        </div>
      </div>
      <div className="bottom">© 2026 Event Hub. A community event sharing platform.</div>
    </footer>
  )
}
