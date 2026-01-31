import React, { useState } from 'react'

export default function Signup({ onSwitch }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e){
    e.preventDefault()
    alert('Account created (demo)')
    onSwitch('login')
  }

  return (
    <section className="container login-page">
      <h2>Sign Up</h2>
      <p className="muted">Create an account to share events with others</p>
      <form className="auth-box" onSubmit={handleSubmit}>
        <label>Email
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password" />
        </label>
        <button className="btn-primary" type="submit">Create account</button>
        <p className="muted">Already have an account? <button type="button" className="link-btn" onClick={() => onSwitch('login')}>Login</button></p>
      </form>
    </section>
  )
}
