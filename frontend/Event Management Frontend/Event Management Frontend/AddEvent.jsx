import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddEvent.css';

const AddEvent = ({ addEvent }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !category || !date || !location || !image) {
      alert('Please fill in all required fields.');
      return;
    }
    addEvent({ name, category, description, date, time, location, image });
    navigate('/');
  };

  return (
    <div className="add-event-container">
      <h1>Add New Event</h1>
      <form onSubmit={handleSubmit} className="add-event-form">
        <div className="form-group">
          <label>Event Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Location *</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Image URL *</label>
          <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" required />
        </div>
        <button type="submit" className="submit-btn">Add Event</button>
      </form>
    </div>
  );
};

export default AddEvent;