import React, { useState } from 'react';

export default function AddEvent({ onAddEvent, onCancel }) {
  // useState holds component data for the form (controlled inputs)
  // Controlled inputs keep React as the single source of truth: inputs use `value={...}` and update via `onChange`.
  // handleSubmit sends the `form` object to the parent via `onAddEvent`, which performs the actual POST request.
  const [form, setForm] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    location: '',
    email: '',
    phone: '',
    imageFile: null,
    description: ''
  });
  const [preview, setPreview] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, imageFile: file }));
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.category || !form.date || !form.location) {
      alert('Please fill in all required fields.');
      return;
    }
    onAddEvent(form);
  }
// controlled form react controls input
  return (
    <div className="container">
      <form className="auth-box" onSubmit={handleSubmit} style={{maxWidth:760}}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Create a New Event</h2>
        <div className="form-row"><label>Title *</label><input name="title" value={form.title} onChange={handleChange} required /></div>
        <div className="form-row"><label>Category *</label><input name="category" value={form.category} onChange={handleChange} required /></div>
        <div className="form-row"><label>Location *</label><input name="location" value={form.location} onChange={handleChange} required /></div>
        <div className="form-row"><label>Date *</label><input type="date" name="date" value={form.date} onChange={handleChange} required /></div>
        <div className="form-row"><label>Time</label><input type="time" name="time" value={form.time} onChange={handleChange} /></div>
        <div className="form-row"><label>Contact Email</label><input type="email" name="email" value={form.email} onChange={handleChange} /></div>
        <div className="form-row"><label>Contact Phone</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} /></div>
        <div className="form-row">
          <label>Upload image (png/jpg)</label>
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <img src={preview} alt="Preview" style={{ maxWidth: '100%', marginTop: 10, borderRadius: 8 }} />}
        </div>
        <div className="form-row"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange}></textarea></div>
        <div className="form-actions" style={{ marginTop: 20 }}>
          <button type="button" className="link-btn" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" type="submit">Create Event</button>
        </div>
      </form>
    </div>
  );
}