import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './AuthPages.css'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const [registerData, setRegisterData] = useState({
    first_name: '',
    phone: ''
  })

  const [pin, setPin] = useState(['', '', '', ''])

  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`register-pin-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handlePinKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.getElementById(`register-pin-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    const pinString = pin.join('')

    console.log('📝 [REGISTER_PAGE] Soumission formulaire d\'inscription')
    console.log('📋 [REGISTER_PAGE] Données d\'inscription:', {
      first_name: registerData.first_name,
      phone: registerData.phone,
      hasPin: !!pinString,
      pinLength: pinString.length
    })

    if (pinString.length !== 4) {
      setError('Veuillez entrer un code PIN à 4 chiffres')
      return
    }

    setError('')
    setLoading(true)

    try {
      console.log('⏳ [REGISTER_PAGE] Appel de la fonction register...')
      await register({ ...registerData, pin: pinString })
      console.log('✅ [REGISTER_PAGE] Inscription réussie! Redirection...')
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ [REGISTER_PAGE] Erreur d\'inscription:', err)
      setError(err.message || 'Erreur d\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-content">
        <Link to="/" className="auth-page-back">
          ← Retour à l'accueil
        </Link>

        <div className="auth-page-header">
          <img src="/logo.PNG" alt="Weylo" className="auth-page-logo" />
          <h1>Inscription</h1>
          <p>Crée ton compte en quelques secondes</p>
        </div>

        {error && (
          <div className="auth-page-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-page-form">
          <div className="form-group">
            <label htmlFor="first_name">
              <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Prénom
            </label>
            <input
              type="text"
              id="first_name"
              value={registerData.first_name}
              onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
              placeholder="Ton prénom"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={registerData.phone}
              onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
              placeholder="+237 6XX XX XX XX"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Code PIN (4 chiffres)
            </label>
            <div className="pin-inputs">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={`register-pin-${index}`}
                  id={`register-pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index]}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="pin-input"
                  required
                />
              ))}
            </div>
            <small>Ce code sera ton mot de passe</small>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>

          <div className="auth-page-switch">
            Déjà un compte ?{' '}
            <Link to="/login">
              Se connecter
            </Link>
          </div>
        </form>
      </div>

      <div className="auth-page-illustration">
        <div className="illustration-content">
          <img src="/logo.PNG" alt="Weylo" className="illustration-logo" />
          <h2>Rejoins la communauté !</h2>
          <p>Crée ton compte gratuitement et commence à recevoir des messages anonymes de tes amis.</p>

          <div className="illustration-features">
            <div className="feature-item">
              <span className="feature-icon">🎭</span>
              <span>100% Anonyme</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📢</span>
              <span>Confessions publiques</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>Gagne de l'argent réel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
