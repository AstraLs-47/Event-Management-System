import React from 'react'

export default function WhyPlatform(){
  return (
    <section className="why-section container">
      <h2>Why This Platform Exists</h2>
      <p className="muted small">We believe everyone should know about the amazing events happening in their community.</p>

      <div className="why-cards">
        <div className="why-card light">
          <h4>The Problem</h4>
          <ul>
            <li>People often miss out on local events because they don't know about them</li>
            <li>Event information is scattered across different platforms</li>
            <li>No easy way to share community events with others</li>
          </ul>
        </div>

        <div className="why-card outlined">
          <h4>Our Solution</h4>
          <ul>
            <li>One central place to find all community events</li>
            <li>Easy search by category (Sports, Music, Education)</li>
            <li>Anyone can share events with the community</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
