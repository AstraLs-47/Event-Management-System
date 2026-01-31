import React, { useState } from 'react'

export default function Login({ onLogin, onCancel }){
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null) // {type: 'success'|'error', text}

  function handleSubmit(e){
    e.preventDefault()
    if(mode === 'login'){
      // call backend login API
      const identifier = username || email
      if(!identifier || !password){
        alert('Please provide username/email and password')
        return
      }
      setMessage(null)
      fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      }).then(async res => {
        const data = await res.json()
        if(!res.ok){
          setMessage({ type: 'error', text: data?.message || 'Login failed' })
          return
        }
        // server returns user object
        const user = data.user || { username: identifier }
        setMessage({ type: 'success', text: 'Logged in successfully' })
        // small delay to show message then notify parent
        setTimeout(()=> onLogin(user), 700)
      }).catch(err => {
        console.error(err)
        setMessage({ type: 'error', text: 'Login error' })
      })
    } else {
      // signup -> call register endpoint
      if(!name || !username || !email || !password){
        setMessage({ type:'error', text:'Please fill full name, username, email and password' })
        return
      }
      const payload = { fullName: name, username, email, password }
      setMessage(null)
      fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async res => {
        const data = await res.json()
        if(!res.ok){
          setMessage({ type:'error', text: data?.message || 'Signup failed' })
          return
        }
        const user = data.user || { username, name }
        setMessage({ type:'success', text: 'Account created successfully' })
        setTimeout(()=> onLogin(user), 700)
      }).catch(err => {
        console.error(err)
        setMessage({ type:'error', text:'Signup error' })
      })
    }
  }

  return (
    <section className="container login-page">
      <h2>{mode === 'login' ? 'Login' : 'Create an account'}</h2>
      <p className="muted">{mode === 'login' ? 'Login to share events with the community' : 'Sign up to start sharing events'}</p>
      <form className="auth-box" onSubmit={handleSubmit}>
        {message && (
          <div className={"form-message " + (message.type === 'success' ? 'success' : 'error')} style={{marginBottom:12}}>{message.text}</div>
        )}
        {mode === 'signup' && (
          <label>Full name
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
          </label>
        )}
        <label>{mode === 'signup' ? 'Username' : 'Username or Email'}
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder={mode === 'signup' ? 'Choose a username' : 'Enter username or email'} />
        </label>
        {mode === 'signup' && (
          <label>Email
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" />
          </label>
        )}
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" />
        </label>
        <button className="btn-primary" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
        <p className="muted">
          {mode === 'login' ? (
            <>Don't have an account? <button type="button" className="link-btn" onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Already have an account? <button type="button" className="link-btn" onClick={() => setMode('login')}>Login</button></>
          )}
        </p>
        <p style={{textAlign:'center',marginTop:8}}><button type="button" className="link-btn" onClick={() => onCancel && onCancel()}>Cancel</button></p>
      </form>
    </section>
  )
}
