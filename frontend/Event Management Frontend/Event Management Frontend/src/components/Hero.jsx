import React from 'react'

export default function Hero({ setPage }){
  return (
    <section id="home" className="hero">
      <div className="container">
        <h1>Discover and Share Events <span className="accent">Around You</span></h1>
        <p className="sub">Join our community platform where people discover upcoming events and share activities with others. Stay connected with what's happening near you.</p>
        <button className="btn-primary" onClick={() => setPage && setPage('events')}>Explore Events</button>
      </div>
    </section>
  )
}
