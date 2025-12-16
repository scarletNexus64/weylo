import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' or 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    first_name: '',
    phone: ''
  })

  const [pin, setPin] = useState(['', '', '', ''])

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('🔐 [AUTH_MODAL] Soumission formulaire de connexion')
    console.log('📋 [AUTH_MODAL] Données de connexion:', {
      username: loginData.username,
      hasPassword: !!loginData.password
    })

    setError('')
    setLoading(true)

    try {
      console.log('⏳ [AUTH_MODAL] Appel de la fonction login...')
      await login(loginData)
      console.log('✅ [AUTH_MODAL] Connexion réussie! Fermeture du modal...')
      onClose()
    } catch (err) {
      console.error('❌ [AUTH_MODAL] Erreur de connexion:', err)
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`auth-pin-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handlePinKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.getElementById(`auth-pin-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    const pinString = pin.join('')

    console.log('📝 [AUTH_MODAL] Soumission formulaire d\'inscription')
    console.log('📋 [AUTH_MODAL] Données d\'inscription:', {
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
      console.log('⏳ [AUTH_MODAL] Appel de la fonction register...')
      await register({ ...registerData, pin: pinString })
      console.log('✅ [AUTH_MODAL] Inscription réussie! Fermeture du modal...')
      onClose()
    } catch (err) {
      console.error('❌ [AUTH_MODAL] Erreur d\'inscription:', err)
      setError(err.message || 'Erreur d\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>

        <div className="auth-modal-header">
          <img src="/logo.PNG" alt="Weylo" className="auth-modal-logo" />
          <h2>{mode === 'login' ? 'Connexion' : 'Inscription'}</h2>
          <p>
            {mode === 'login'
              ? 'Connecte-toi pour accéder à tes messages'
              : 'Crée ton compte en quelques secondes'}
          </p>
        </div>

        {error && (
          <div className="auth-modal-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="auth-modal-form">
            <div className="form-group">
              <label htmlFor="username">Username ou Email</label>
              <input
                type="text"
                id="username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="john_doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="auth-modal-switch">
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => setMode('register')}>
                S'inscrire
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-modal-form">
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
                    key={`auth-pin-${index}`}
                    id={`auth-pin-${index}`}
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

            <div className="auth-modal-switch">
              Déjà un compte ?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Se connecter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
