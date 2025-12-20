import { useEffect, useState } from 'react'
import './GiftAnimation.css'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#F67280',
  '#C06C84', '#6C5B7B', '#FF85A2', '#FFD97D', '#AAF683'
]

export default function GiftAnimation({ gift, onComplete }) {
  const [particles, setParticles] = useState([])
  const [showGift, setShowGift] = useState(false)

  useEffect(() => {
    // Afficher directement le cadeau avec particules
    const sequence = async () => {
      setShowGift(true)
      generateParticles()

      // Terminer après 3 secondes
      await wait(3000)
      if (onComplete) onComplete()
    }

    sequence()
  }, [gift, onComplete])

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const generateParticles = () => {
    const count = 40

    const newParticles = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360
      const distance = 100 + Math.random() * 150

      return {
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle,
        distance,
        delay: Math.random() * 0.2,
        duration: 1.5 + Math.random() * 1,
      }
    })

    setParticles(newParticles)
  }

  return (
    <div className="gift-animation-overlay">
      {/* Fond avec la couleur du cadeau */}
      <div
        className="animated-background"
        style={{
          background: `radial-gradient(circle at center, ${gift.background_color}40 0%, rgba(0,0,0,0.95) 70%)`
        }}
      >
        <div className="gradient-orb orb-1" style={{ background: gift.background_color }}></div>
        <div className="gradient-orb orb-2" style={{ background: gift.background_color }}></div>
        <div className="gradient-orb orb-3" style={{ background: gift.background_color }}></div>
      </div>

      {/* Cadeau révélé */}
      {showGift && (
        <>
          {/* Particules en explosion */}
          <div className="particles-wrapper">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="particle particle-burst"
                style={{
                  '--angle': `${particle.angle}deg`,
                  '--distance': `${particle.distance}px`,
                  '--delay': `${particle.delay}s`,
                  '--duration': `${particle.duration}s`,
                  '--color': particle.color,
                }}
              />
            ))}
          </div>

          {/* Container principal */}
          <div className="gift-reveal-center">
            {/* Cercles lumineux pulsants */}
            <div className="light-rings">
              <div className="ring ring-1" style={{ borderColor: gift.background_color }}></div>
              <div className="ring ring-2" style={{ borderColor: gift.background_color }}></div>
              <div className="ring ring-3" style={{ borderColor: gift.background_color }}></div>
            </div>

            {/* ICÔNE DU CADEAU - TRÈS GRANDE ET VISIBLE */}
            <div className="gift-icon-giant">
              {/* Glow effect derrière l'icône */}
              <div
                className="icon-glow-bg"
                style={{
                  background: `radial-gradient(circle, ${gift.background_color}80 0%, ${gift.background_color}40 40%, transparent 70%)`
                }}
              ></div>

              {/* L'icône elle-même */}
              <div className="icon-container">
                <span className="gift-icon-emoji">{gift.icon || '🎁'}</span>
              </div>
            </div>

            {/* Texte du cadeau */}
            <div className="gift-info-text">
              <h2 className="gift-title-anim">Cadeau Envoyé !</h2>
              <p className="gift-name-anim">{gift.name}</p>
              {gift.formatted_price && (
                <p className="gift-price-anim">{gift.formatted_price}</p>
              )}
            </div>

            {/* Ondes */}
            <div className="wave-ripples">
              <div className="wave-ripple r1" style={{ borderColor: gift.background_color }}></div>
              <div className="wave-ripple r2" style={{ borderColor: gift.background_color }}></div>
              <div className="wave-ripple r3" style={{ borderColor: gift.background_color }}></div>
            </div>
          </div>

          {/* Rayons rotatifs */}
          <div className="rotating-beams">
            <div className="beam-ray b1" style={{ background: `linear-gradient(90deg, transparent, ${gift.background_color}60, transparent)` }}></div>
            <div className="beam-ray b2" style={{ background: `linear-gradient(90deg, transparent, ${gift.background_color}40, transparent)` }}></div>
            <div className="beam-ray b3" style={{ background: `linear-gradient(90deg, transparent, ${gift.background_color}60, transparent)` }}></div>
            <div className="beam-ray b4" style={{ background: `linear-gradient(90deg, transparent, ${gift.background_color}40, transparent)` }}></div>
          </div>
        </>
      )}
    </div>
  )
}
