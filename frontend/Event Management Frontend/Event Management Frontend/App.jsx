import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AddEvent from './pages/AddEvent';
import EventDetail from './pages/EventDetail';

function App() {
  const [events, setEvents] = useState([
    {
      id: '1',
      name: 'Tech Conference 2024',
      category: 'Technology',
      description: 'An annual conference for tech enthusiasts and professionals. Featuring talks from industry leaders on AI, blockchain, and more.',
      date: '2024-10-26',
      time: '09:00',
      location: 'Metropolis Convention Center',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop'
    },
    {
      id: '2',
      name: 'Summer Music Festival',
      category: 'Music',
      description: 'A 3-day outdoor music festival with a lineup of international artists. Enjoy live music, food trucks, and art installations.',
      date: '2024-08-15',
      time: '12:00',
      location: 'Greenfield Park',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop'
    }
  ]);

  const addEvent = (event) => {
    setEvents([...events, { ...event, id: Date.now().toString() }]);
  };

  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/add-event">Add Event</Link>
      </nav>
      <main style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<Home events={events} />} />
          <Route path="/add-event" element={<AddEvent addEvent={addEvent} />} />
          <Route path="/event/:id" element={<EventDetail events={events} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;