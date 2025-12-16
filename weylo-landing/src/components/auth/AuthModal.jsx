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
    phone: '',
    pin: ''
  })

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(loginData)
      onClose()
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(registerData)
      onClose()
    } catch (err) {
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
              <label htmlFor="first_name">Prénom</label>
              <input
                type="text"
                id="first_name"
                value={registerData.first_name}
                onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
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
              <label htmlFor="pin">Code PIN (4 chiffres)</label>
              <input
                type="password"
                id="pin"
                value={registerData.pin}
                onChange={(e) => setRegisterData({ ...registerData, pin: e.target.value })}
                placeholder="••••"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
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
