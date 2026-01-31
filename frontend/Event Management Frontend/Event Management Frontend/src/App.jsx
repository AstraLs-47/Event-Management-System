import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import WhyPlatform from './components/WhyPlatform'
import EventsList from './components/EventsList'
import EventHighlights from './components/EventHighlights'
import EventDetail from './components/EventDetail'
import AddEvent from './components/AddEvent'
import Footer from './components/Footer'
import Login from './components/Login'

const socket = io('http://localhost:5000');


export default function App(){
  const [page, setPage] = useState('home')
  const [viewingId, setViewingId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title:'', category:'', date:'', time:'', location:'', email:'', phone:'', image:'', imageFile:null, imageBase64:null, description:'' })
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [userEvents, setUserEvents] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [comments, setComments] = useState([])

  const initialEvents = [
  ]

  const [events, setEvents] = useState(() => {
    try{
      const raw = localStorage.getItem('events')
      return raw ? JSON.parse(raw) : initialEvents
    }catch(e){
      return initialEvents
    }
  })

  useEffect(()=>{
    try{ localStorage.setItem('events', JSON.stringify(events)) }catch(e){}
  },[events])

  // Fetch events once when the App mounts and store them in state (does not change page)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/events/', { method: 'GET', credentials: 'include' });
        const data = await res.json();
        const list = Array.isArray(data) ? data : ((data && data.events) || []);
        if (res.ok) {
          const mapped = list.map(ev => ({
            id: ev.id,
            title: ev.title || ev.name || '',
            category: ev.type || ev.category || ev.kind || '',
            date: ev.date || ev.when || '',
            time: ev.time || ev.at || '',
            location: ev.location || ev.venue || '',
            email: ev.email || '',
            phone: ev.phone || '',
            image: ev.image || ev.picture || '/image/eventpic1.png',
            description: ev.description || ev.details || '',
            createdBy: ev.user?.username || ev.user?.fullName || 'imported'
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error('Initial events fetch error', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (viewingId) {
      socket.emit('join-event-room', viewingId);

      const handleNewComment = (comment) => {
        // Normalize backend shape (content -> text) and add user info if not present
        const mapped = { ...comment, text: comment.content || comment.text };
        if (!mapped.user && comment.userId === currentUser?.id) {
          mapped.user = { fullName: currentUser.fullName, username: currentUser.username };
        }
        setComments(prevComments => [...prevComments, mapped]);
      };

      // listen for both possible event names (server may emit 'newComment' or 'new-comment')
      socket.on('new-comment', handleNewComment);
      socket.on('newComment', handleNewComment);

      return () => {
        socket.emit('leave-event-room', viewingId);
        socket.off('new-comment', handleNewComment);
        socket.off('newComment', handleNewComment);
      };
    }
  }, [viewingId, currentUser]);

  async function fetchComments(eventId) {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/comments`);
      if (res.ok) {
        const data = await res.json();
        // server may return an array or an object { comments: [...] }
        const arr = Array.isArray(data) ? data : (data.comments || []);
        // normalize comment shape: use text property in UI
        const mapped = arr.map(c => ({ ...c, text: c.content || c.text }));
        setComments(mapped);
      } else {
        console.error('Failed to fetch comments');
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  }

  function viewEvent(id) {
    setViewingId(id);
    fetchComments(id);
    setPage('event-detail');
  }

  function backToEvents() {
    setViewingId(null);
    setComments([]);
    loadEvents(); // This also sets page to 'events'
  }

  function handleLogin(user){
    setCurrentUser(user)
    setPage('home')
  }

  function handleLogout(){
    // call backend to clear cookie/token
    fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.warn('logout error', err)).finally(() => {
      setCurrentUser(null)
      setPage('home')
      setSuccessMessage('Logged out successfully')
      setTimeout(()=>setSuccessMessage(''),3000)
    })
  }

  // requestLogout will open confirmation modal
  function requestLogout(){
    setConfirmPayload({ type: 'logout' })
    setShowConfirm(true)
  }

 async function loadProfile(){
    try{
      // backend now exposes GET /api/user/profile which may include both user info and the user's events
      const res = await fetch('http://localhost:5000/api/user/profile', { method: 'GET', credentials: 'include' })
      const data = await res.json()
      if(res.ok && data){
        // server might return { user: {...}, events: [...] } or a merged user object with events property
        const user = data.user || (data.id ? data : null)
        if(user) setCurrentUser(user)

        // If server included events in the profile response, map and set them
        const eventsFromProfile = data.events || (user && user.events) || null
        if(Array.isArray(eventsFromProfile)){
          const mapped = eventsFromProfile.map(ev => ({
            id: ev.id,
            title: ev.title || ev.name || '',
            category: ev.type || ev.category || ev.kind || '',
            date: ev.date || ev.when || '',
            time: ev.time || ev.at || '',
            location: ev.location || ev.venue || '',
            email: ev.email || '',
            phone: ev.phone || '',
            image: ev.image || ev.picture || '/image/eventpic1.png',
            description: ev.description || ev.details || '',
            createdBy: ev.user?.username || ev.user?.fullName || (user && (user.username || user.fullName || user.name)) || 'imported'
          }))
          setUserEvents(mapped)
        } else if(user && user.id){
          // fallback: if no events attached, try the separate events endpoint
          loadUserEvents(user.id)
        }

        setPage('profile')
        return
      }
      // If server failed but we have a local currentUser (from login), fall back to it
      if(currentUser){
        console.warn('Profile fetch failed, falling back to local user', data)
        // attempt to load events for the existing currentUser
        if(currentUser && currentUser.id) loadUserEvents(currentUser.id)
        setPage('profile')
        return
      }
      alert(data?.message || 'Failed to load profile')
    }catch(err){
      console.error('profile error', err)
      if(currentUser){
        // attempt to load user's events from local currentUser id if available
        if(currentUser && currentUser.id) loadUserEvents(currentUser.id)
        setPage('profile')
        return
      }
      alert('Error loading profile')
    }
  }

  async function loadUserEvents(userId){
    try{
      const res = await fetch(`http://localhost:5000/api/events/user/${userId}`, { method: 'GET', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data) {
        // Support two possible response shapes:
        // 1) [{...}, {...}] (array)
        // 2) { events: [{...}, ...] }
        const list = Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : [])
        if (list.length) {
          const mapped = list.map(ev => ({
          id: ev.id,
          title: ev.title || ev.name || '',
          category: ev.type || ev.category || ev.kind || '',
          date: ev.date || ev.when || '',
          time: ev.time || ev.at || '',
          location: ev.location || ev.venue || '',
          email: ev.email || '',
          phone: ev.phone || '',
          image: ev.image || ev.picture || '/image/eventpic1.png',
          description: ev.description || ev.details || '',
          createdBy: ev.user?.username || ev.user?.fullName || currentUser?.username || 'imported'
          }))
          setUserEvents(mapped)
          return
        }
      }
      setUserEvents([])
    }catch(err){
      console.error('loadUserEvents error', err)
      setUserEvents([])
    }
  }

  function addEvent(newEvent){
    setEvents(prev => {
      // If server returned an id, use the server event as-is, otherwise generate local id
      if(newEvent && newEvent.id){
        const ev = { ...newEvent, createdBy: newEvent.createdBy || currentUser?.username || 'anonymous' }
        // if the new event belongs to the currently logged in user, add to userEvents too
        if(ev.createdBy && currentUser && ev.createdBy === (currentUser.username || currentUser.fullName || currentUser.name)){
          setUserEvents(u => [{ ...ev }, ...u])
        }
        return [{ ...ev }, ...prev]
      }
      const local = { ...newEvent, id: Date.now(), createdBy: currentUser?.username || 'anonymous' }
      if(local.createdBy && currentUser && local.createdBy === (currentUser.username || currentUser.fullName || currentUser.name)){
        setUserEvents(u => [{ ...local }, ...u])
      }
      return [{ ...local }, ...prev]
    })
    setPage('events')
  }

  function submitComment(commentText) {
    if (!currentUser || !viewingId) return;
    // POST to backend API so server creates the comment and broadcasts it
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/events/${viewingId}/comments`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: commentText })
        });
        if (res.ok) {
          const created = await res.json();
          const mapped = { ...created, text: created.content || created.text };
          setComments(prev => [...prev, mapped]);
        } else {
          console.error('Failed to post comment');
        }
      } catch (err) {
        console.error('Error posting comment', err);
      }
    })();
  }

  // This function is called by the AddEvent component (via `onAddEvent`) and demonstrates a fetch() POST request
  // It receives the controlled `form` object and uploads it (including image via FormData) to the backend.


  async function submitNewEvent(form) {
    console.debug('submitNewEvent: form received', form)
    if (!currentUser) {
      alert('You must be logged in to create an event.');
      setPage('login');
      return;
    }
    try {
      const payloadFields = {
        title: form.title,
        location: form.location,
        date: form.date,
        email: form.email,
        phone: form.phone,
        type: form.category,
        description: form.description,
        time: form.time
      };

      const fd = new FormData();
      for (const k in payloadFields) {
        if (payloadFields[k] !== undefined) {
          fd.append(k, payloadFields[k]);
        }
      }
      if (form.imageFile) {
        fd.append('image', form.imageFile);
      }

      const res = await fetch('http://localhost:5000/api/events/', {
        method: 'POST',
        credentials: 'include',
        body: fd
      });

      // backend logic
      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to create event');
        return;
      }

      addEvent(data);
      setSuccessMessage('Event created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('submitNewEvent error', err);
      alert('Error creating event');
    }
  }

  async function loadEvents(){
    try{
      const res = await fetch('http://localhost:5000/api/events/', { method: 'GET', credentials: 'include' })
      const data = await res.json()
      const list = Array.isArray(data) ? data : ((data && data.events) || [])
      if(res.ok){
        // Map server events to local event shape where possible
        const mapped = list.map(ev => ({
          id: ev.id,
          title: ev.title || ev.name || '',
          category: ev.type || ev.category || ev.kind || '',
          date: ev.date || ev.when || '',
          time: ev.time || ev.at || '',
          location: ev.location || ev.venue || '',
          email: ev.email || '',
          phone: ev.phone || '',
          image: ev.image || ev.picture || '/image/eventpic1.png',
          description: ev.description || ev.details || '',
          createdBy: ev.user?.username || ev.user?.fullName || 'imported'
        }))
        setEvents(mapped)
        setPage('events')
        return
      }
      // fallback: keep existing events and navigate
      setPage('events')
    }catch(err){
      console.error('loadEvents error', err)
      setPage('events')
    }
  }

  async function deleteEvent(id){
    try{
      const res = await fetch(`http://localhost:5000/api/events/${id}`, { method: 'DELETE', credentials: 'include' })
      if(!res.ok){
        const d = await res.json().catch(()=> ({}))
        setSuccessMessage('')
        alert(d?.message || 'Failed to delete event')
        return
      }
      setEvents(prev => prev.filter(e=>e.id!==id))
      setUserEvents(prev => prev.filter(e=>e.id!==id))
      setSuccessMessage('Event deleted successfully')
      setTimeout(()=>setSuccessMessage(''),3000)
    }catch(err){
      console.error('deleteEvent error', err)
      alert('Error deleting event')
    }
  }

  function requestAddEvent() {
    if (currentUser) {
      setPage('add-event');
    } else {
      setPage('login');
    }
  }

  function startEdit(ev){
    setEditingId(ev.id)
    setEditForm({ title:ev.title||'', category:ev.category||'', date:ev.date||'', time:ev.time||'', location:ev.location||'', email:ev.email||'', phone:ev.phone||'', image:ev.image||'', imageFile:null, imageBase64:null, description:ev.description||'' })
    setPage('profile')
  }

  function cancelEdit(){
    setEditingId(null)
    setEditForm({ title:'', category:'', date:'', time:'', location:'', email:'', phone:'', image:'', description:'' })
  }

  function handleEditFile(e){
    const file = e.target.files && e.target.files[0]
    if(!file) return
    const url = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = () => {
      setEditForm(f => ({ ...f, image: url, imageFile: file, imageBase64: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  async function saveEdit(e){
    e.preventDefault()
    if(!editingId) return
    try{
      let res, data
      // Prepare allowed fields similar to server whitelist
      const payloadFields = {
        title: editForm.title,
        location: editForm.location,
        date: editForm.date,
        email: editForm.email,
        phone: editForm.phone,
        type: editForm.category,
        description: editForm.description,
        time: editForm.time
      }

      if(editForm.imageFile){
        const fd = new FormData()
        for(const k in payloadFields) if(payloadFields[k] !== undefined) fd.append(k, payloadFields[k])
        fd.append('image', editForm.imageFile)
        res = await fetch(`http://localhost:5000/api/events/${editingId}`, { method: 'PUT', credentials: 'include', body: fd })
        data = await res.json()
      } else {
        // include imageBase64 if present so server can save it
        const body = { ...payloadFields }
        if(editForm.imageBase64) body.image = editForm.imageBase64
        else if(editForm.image) body.image = editForm.image
        res = await fetch(`http://localhost:5000/api/events/${editingId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
      }

      if(!res.ok){
        alert(data?.message || 'Failed to update event')
        return
      }

      const ev = data
      const mapped = {
        id: ev.id,
        title: ev.title || ev.name || editForm.title || '',
        category: ev.type || ev.category || editForm.category || '',
        date: ev.date || ev.when || editForm.date || '',
        time: ev.time || ev.at || editForm.time || '',
        location: ev.location || ev.venue || editForm.location || '',
        email: ev.email || editForm.email || '',
        phone: ev.phone || editForm.phone || '',
        image: ev.image || ev.picture || editForm.image || '/image/eventpic1.png',
        description: ev.description || ev.details || editForm.description || '',
        createdBy: ev.user?.username || ev.user?.fullName || currentUser?.username || 'anonymous'
      }

      setEvents(prev => prev.map(p => p.id === mapped.id ? { ...p, ...mapped } : p))
      setUserEvents(prev => prev.map(p => p.id === mapped.id ? { ...p, ...mapped } : p))
      cancelEdit()
    }catch(err){
      console.error('saveEdit error', err)
      alert('Error updating event')
    }
  }

  function requestDelete(id){
    setConfirmPayload({ type: 'delete', id })
    setShowConfirm(true)
  }

  function handleConfirmResult(confirmed){
    setShowConfirm(false)
    const p = confirmPayload
    setConfirmPayload(null)
    if(!confirmed || !p) return
    if(p.type === 'logout'){
      handleLogout()
    }else if(p.type === 'delete'){
      deleteEvent(p.id)
    }
  }

  return (
    <div>
      <Header page={page} setPage={setPage} currentUser={currentUser} onLogout={requestLogout} onProfileClick={loadProfile} onEventsClick={loadEvents} onAddEventClick={requestAddEvent} />
      <main>
        {page === 'home' && (
          <>
            <Hero setPage={setPage} />
            <WhyPlatform />
            <HowItWorks />
            <EventHighlights />
            <div className="join-band">
              <h3>Join Our Community</h3>
              <p>Start discovering events or share your own with the community today!</p>
            </div>
          </>
        )}

        {page === 'events' && <EventsList events={events} onViewEvent={viewEvent} />}

        {page === 'event-detail' && viewingId && (
          <EventDetail
            event={events.find(e => e.id === viewingId) || userEvents.find(e => e.id === viewingId)}
            onBack={backToEvents}
            currentUser={currentUser}
            comments={comments}
            onCommentSubmit={submitComment}
            setPage={setPage}
          />
        )}

        {page === 'add-event' && (
          <AddEvent
            onAddEvent={submitNewEvent}
            onCancel={() => setPage('events')}
          />
        )}

        {page === 'login' && <Login onLogin={handleLogin} onCancel={() => setPage('home')} />}

        {page === 'profile' && currentUser && (
          <section className="container">
            {successMessage && <div style={{maxWidth:760,margin:'12px auto'}}><div className="form-message success">{successMessage}</div></div>}
            <div className="profile-card" style={{maxWidth:760,margin:'26px auto 0'}}>
              <div className="profile-top" style={{display:'flex',alignItems:'center',gap:16}}>
                <div className="avatar" style={{width:120,height:120,borderRadius:999,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'#eee'}}>
                  {!avatarBroken ? (
                    <img src={currentUser.avatar || '/image/avatar.png'} alt={currentUser.fullName || currentUser.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={() => setAvatarBroken(true)} />
                  ) : (
                    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',background:'var(--accent)',fontSize:48}}>{(currentUser.fullName || currentUser.name || currentUser.username || 'U')[0].toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <h2 style={{margin:0}}>{currentUser.fullName || currentUser.name || currentUser.username || currentUser.email}</h2>
                  <div className="user-info" style={{marginTop:8}}>
                    <p style={{margin:'6px 0'}}><strong>Username:</strong> {currentUser.username || currentUser.fullName || currentUser.name || ''}</p>
                    <p style={{margin:'6px 0'}}><strong>Email:</strong> {currentUser.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{maxWidth:760,margin:'18px auto 0'}}>
              <h3>My Posts</h3>
              {userEvents.length===0 && <p className="muted">You haven't posted any events yet.</p>}
              <div className="event-list">
                {userEvents.map(ev=> (
                  <div key={ev.id} className="event-item" style={{position:'relative'}}>
                    {editingId === ev.id ? (
                      <form className="auth-box" onSubmit={saveEdit} style={{width:'100%'}}>
                        <label>Title<input value={editForm.title} onChange={e=>setEditForm(f=>({ ...f, title:e.target.value }))} /></label>
                        <label>Category<input value={editForm.category} onChange={e=>setEditForm(f=>({ ...f, category:e.target.value }))} /></label>
                        <label>Location<input value={editForm.location} onChange={e=>setEditForm(f=>({ ...f, location:e.target.value }))} /></label>
                        <label>Date<input value={editForm.date} onChange={e=>setEditForm(f=>({ ...f, date:e.target.value }))} /></label>
                        <label>Time<input value={editForm.time} onChange={e=>setEditForm(f=>({ ...f, time:e.target.value }))} /></label>
                        <label>Upload image (png/jpg)
                          <input type="file" accept="image/*" onChange={handleEditFile} />
                        </label>
                        <label>Description<textarea value={editForm.description} onChange={e=>setEditForm(f=>({ ...f, description:e.target.value }))} /></label>
                        <div className="form-actions" style={{marginTop:8}}>
                          <button className="btn-primary" type="submit">Save</button>
                          <button type="button" className="link-btn" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <img className="thumb" src={ev.image} alt={ev.title} />
                        <div className="info">
                          <div className="cat">{ev.category}</div>
                          <h4>{ev.title}</h4>
                          <div className="meta">
                            <div className="location">{ev.location}</div>
                            <div className="date">{ev.date}</div>
                            <div className="time">{ev.time}</div>
                            <div className="contact email">{ev.email}</div>
                            <div className="contact phone">{ev.phone}</div>
                          </div>
                          <p className="desc">{ev.description}</p>
                        </div>
                        <div style={{position:'absolute',right:12,top:12}}>
                          <div className="action-box">
                            <button className="action-btn" onClick={()=>startEdit(ev)}>Edit</button>
                            <button className="action-btn danger" onClick={()=>requestDelete(ev.id)}>Delete</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showConfirm && (
          <div className="confirm-modal">
            <div className="confirm-card">
              <p style={{margin:0,fontWeight:700}}>{confirmPayload?.type === 'logout' ? 'Confirm logout?' : 'Confirm delete event?'}</p>
              <p className="muted" style={{marginTop:8}}>{confirmPayload?.type === 'logout' ? 'Are you sure you want to logout?' : 'This will permanently delete the event.'}</p>
              <div className="confirm-actions" style={{marginTop:12,display:'flex',gap:8}}>
                <button className="link-btn" onClick={()=>handleConfirmResult(false)}>Cancel</button>
                <button className="btn-primary" onClick={()=>handleConfirmResult(true)}>{confirmPayload?.type === 'logout' ? 'Confirm' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}

        {page === 'about' && (
          <>
            <section className="hero about-hero" style={{padding:'60px 20px'}}>
              <div className="container">
                <h2>About Event Hub</h2>
                <p className="muted">Learn more about our community event sharing platform.</p>
              </div>
            </section>

            <section className="container about-section" style={{paddingTop:30}}>
              <div className="about-container" style={{maxWidth:900,margin:'0 auto'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>
                  <div className="about-purpose" style={{display:'flex',gap:18,alignItems:'flex-start'}}>
                    <div style={{width:48,height:48,borderRadius:24,background:'rgba(179,58,54,0.06)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>⚑</div>
                    <div>
                      <h3>Our Purpose</h3>
                      <p className="muted">Event Hub is a community-based platform created to help people discover and share events happening around them. We aim to make sure everyone in the community stays informed about what's nearby.</p>
                    </div>
                  </div>

                  <div style={{marginTop:18}}>
                    <h4>How We Help</h4>
                    <div className="help-list" style={{marginTop:12}}>
                      <div className="help-card">
                        <strong>1 Discover Local Events</strong>
                        <p className="muted" style={{margin:6}}>Find sports games, music concerts, and workshops happening in your area.</p>
                      </div>
                      <div className="help-card">
                        <strong>2 Easy Search</strong>
                        <p className="muted" style={{margin:6}}>Search events by category to quickly find what interests you.</p>
                      </div>
                      <div className="help-card">
                        <strong>3 Share Your Events</strong>
                        <p className="muted" style={{margin:6}}>Organizing an event? Login and share it with the community so others can join.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer setPage={setPage} />
    </div>
  )
}
