import React from 'react'

export default function Header({ page, setPage, currentUser, onLogout, onProfileClick, onEventsClick, onAddEventClick }){
  function initials(name){
    const src = name || ''
    if(!src) return 'U'
    return src.trim().charAt(0).toUpperCase()
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand" onClick={() => setPage('home')} style={{cursor:'pointer'}}>Event Hub</div>
        <nav className="nav">
          <button className={"nav-link" + (page==='home' ? ' active' : '')} onClick={() => setPage('home')}>Home</button>
          <button className={"nav-link" + (page==='events' ? ' active' : '')} onClick={() => onEventsClick ? onEventsClick() : setPage('events')}>Events</button>
          <button className={"nav-link" + (page==='about' ? ' active' : '')} onClick={() => setPage('about')}>About</button>
        </nav>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <button className="add-event" onClick={onAddEventClick}>Add Event</button>
          {currentUser ? (
            <>
              <div className="profile-wrap">
                <button className="profile-btn" onClick={() => onProfileClick ? onProfileClick() : setPage('profile')}>{initials(currentUser.fullName || currentUser.name || currentUser.username)}</button>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <button className="login-btn" onClick={() => setPage('login')}>Login</button>
              <button className="profile-outline" title="Profile" onClick={() => setPage('login')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#b33a36" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 20a8 8 0 0 1 16 0" stroke="#b33a36" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
