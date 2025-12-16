import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './AuthPages.css'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('🔐 [LOGIN_PAGE] Soumission formulaire de connexion')
    console.log('📋 [LOGIN_PAGE] Données de connexion:', {
      username: loginData.username,
      hasPassword: !!loginData.password
    })

    setError('')
    setLoading(true)

    try {
      console.log('⏳ [LOGIN_PAGE] Appel de la fonction login...')
      await login(loginData)
      console.log('✅ [LOGIN_PAGE] Connexion réussie! Redirection...')
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ [LOGIN_PAGE] Erreur de connexion:', err)
      setError(err.message || 'Erreur de connexion')
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
          <h1>Connexion</h1>
          <p>Connecte-toi pour accéder à tes messages</p>
        </div>

        {error && (
          <div className="auth-page-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-page-form">
          <div className="form-group">
            <label htmlFor="username">Username ou Email</label>
            <input
              type="text"
              id="username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              placeholder="john_doe"
              required
              autoFocus
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

          <div className="auth-page-switch">
            Pas encore de compte ?{' '}
            <Link to="/register">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>

      <div className="auth-page-illustration">
        <div className="illustration-content">
          <img src="/logo.PNG" alt="Weylo" className="illustration-logo" />
          <h2>Content de te revoir !</h2>
          <p>Connecte-toi pour voir tous tes messages anonymes et découvrir qui t'a écrit.</p>

          <div className="illustration-features">
            <div className="feature-item">
              <span className="feature-icon">💌</span>
              <span>Messages anonymes illimités</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Chat en temps réel</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎁</span>
              <span>Reçois et envoie des cadeaux</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
