import React from 'react'

import musicImg from '../../image/aa.jpg'
import techImg from '../../image/rof 1.jpg'
import businessImg from '../../image/alx.jpg'
import concertsImg from '../../image/tennis.jpg'

export default function EventHighlights(){
  const images = [
    {src: musicImg, alt: 'aa'},
    {src: techImg, alt: 'rof 1'},
    {src: businessImg, alt: 'alx'},
    {src: concertsImg, alt: 'tennis'}
  ]

  return (
    <section className="highlights container">
      <h2>Event Highlights</h2>
      <p className="lead">Catch a glimpse of the amazing experiences our community has enjoyed. From electrifying concerts to insightful conferences.</p>

      <div style={{display:'flex',justifyContent:'center',marginTop:24}}>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',width:'100%',maxWidth:980}}>
          {images.map((img, idx) => (
            <figure key={idx} style={{flex:'1 1 220px',maxWidth:240,margin:0,background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 6px 18px rgba(0,0,0,0.12)',border:'1px solid rgba(0,0,0,0.06)'}}>
              <img src={img.src} alt={img.alt} style={{width:'100%',height:160,objectFit:'cover',display:'block'}} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
