import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { verifyIdentity, resetPasswordByPhone } from '../services/apiClient'
import './AuthPages.css'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginData, setLoginData] = useState({
    username: '',
    pin: ['', '', '', '']
  })

  // État pour le modal de réinitialisation de mot de passe
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: vérifier identité, 2: nouveau PIN
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetData, setResetData] = useState({
    firstName: '',
    phone: '',
    newPin: ['', '', '', '']
  })
  const [verifiedUsername, setVerifiedUsername] = useState('')

  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...loginData.pin]
    newPin[index] = value
    setLoginData({ ...loginData, pin: newPin })

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handlePinKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  // Gestion du PIN de réinitialisation
  const handleResetPinChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return

    const newPin = [...resetData.newPin]
    newPin[index] = value
    setResetData({ ...resetData, newPin })

    if (value && index < 3) {
      const nextInput = document.getElementById(`reset-pin-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleResetPinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.getElementById(`reset-pin-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  // Ouvrir le modal de réinitialisation
  const openResetModal = () => {
    setShowResetModal(true)
    setResetStep(1)
    setResetError('')
    setResetSuccess('')
    setResetData({
      firstName: '',
      phone: '',
      newPin: ['', '', '', '']
    })
    setVerifiedUsername('')
  }

  // Fermer le modal de réinitialisation
  const closeResetModal = () => {
    setShowResetModal(false)
    setResetStep(1)
    setResetError('')
    setResetSuccess('')
    setResetData({
      firstName: '',
      phone: '',
      newPin: ['', '', '', '']
    })
    setVerifiedUsername('')
  }

  // Étape 1: Vérifier l'identité
  const handleVerifyIdentity = async (e) => {
    e.preventDefault()

    if (!resetData.firstName.trim()) {
      setResetError('Veuillez entrer votre prénom')
      return
    }

    if (!resetData.phone.trim()) {
      setResetError('Veuillez entrer votre numéro de téléphone')
      return
    }

    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      const response = await verifyIdentity(resetData.firstName, resetData.phone)
      console.log('✅ [RESET_PASSWORD] Identité vérifiée:', response)

      if (response.success) {
        setVerifiedUsername(response.data?.username || '')
        setResetSuccess(response.message)
        setResetStep(2)
      } else {
        setResetError(response.message || 'Erreur lors de la vérification')
      }
    } catch (err) {
      console.error('❌ [RESET_PASSWORD] Erreur vérification:', err)
      setResetError(err.response?.data?.message || 'Aucun compte trouvé avec ces informations')
    } finally {
      setResetLoading(false)
    }
  }

  // Étape 2: Réinitialiser le PIN
  const handleResetPassword = async (e) => {
    e.preventDefault()

    const pinString = resetData.newPin.join('')
    if (pinString.length !== 4) {
      setResetError('Veuillez entrer votre nouveau code PIN à 4 chiffres')
      return
    }

    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      const response = await resetPasswordByPhone(
        resetData.firstName,
        resetData.phone,
        pinString
      )
      console.log('✅ [RESET_PASSWORD] Mot de passe réinitialisé:', response)

      setResetSuccess(response.message || 'Mot de passe réinitialisé avec succès !')

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        closeResetModal()
      }, 2000)
    } catch (err) {
      console.error('❌ [RESET_PASSWORD] Erreur réinitialisation:', err)
      setResetError(err.response?.data?.message || 'Erreur lors de la réinitialisation')
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!loginData.username.trim()) {
      setError('Veuillez entrer votre nom d\'utilisateur ou téléphone')
      return
    }

    const pinString = loginData.pin.join('')
    if (pinString.length !== 4) {
      setError('Veuillez entrer votre code PIN à 4 chiffres')
      return
    }

    console.log('🔐 [LOGIN_PAGE] Soumission formulaire de connexion')
    console.log('📋 [LOGIN_PAGE] Données de connexion:', {
      username: loginData.username,
      hasPin: pinString.length === 4
    })

    setError('')
    setLoading(true)

    try {
      console.log('⏳ [LOGIN_PAGE] Appel de la fonction login...')
      await login({ username: loginData.username, password: pinString })
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
            <label htmlFor="username">Numéro de téléphone ou Username</label>
            <input
              type="text"
              id="username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              placeholder="@username ou +237XXXXXXXXX"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="pin">Code PIN (4 chiffres)</label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={`pin-${index}`}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={loginData.pin[index]}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  style={{
                    width: '50px',
                    height: '50px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                  required
                />
              ))}
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              type="button"
              onClick={openResetModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div className="auth-page-switch">
            Pas encore de compte ?{' '}
            <Link to="/register">
              S'inscrire
            </Link>
          </div>
        </form>

        {/* Modal de réinitialisation de mot de passe */}
        {showResetModal && (
          <div className="modal-overlay" onClick={closeResetModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Réinitialiser le PIN</h2>
                <button onClick={closeResetModal} className="modal-close">&times;</button>
              </div>

              <div className="modal-body">
                {resetError && (
                  <div className="auth-page-error">
                    <span>⚠️</span> {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="auth-page-success">
                    <span>✅</span> {resetSuccess}
                  </div>
                )}

                {resetStep === 1 && (
                  <form onSubmit={handleVerifyIdentity}>
                    <div className="form-group">
                      <label htmlFor="reset-firstname">Prénom</label>
                      <input
                        type="text"
                        id="reset-firstname"
                        value={resetData.firstName}
                        onChange={(e) => setResetData({ ...resetData, firstName: e.target.value })}
                        placeholder="Votre prénom"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="reset-phone">Numéro de téléphone</label>
                      <input
                        type="text"
                        id="reset-phone"
                        value={resetData.phone}
                        onChange={(e) => setResetData({ ...resetData, phone: e.target.value })}
                        placeholder="+237XXXXXXXXX"
                        required
                      />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={resetLoading}>
                      {resetLoading ? 'Vérification...' : 'Vérifier'}
                    </button>
                  </form>
                )}

                {resetStep === 2 && (
                  <form onSubmit={handleResetPassword}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <p>Compte trouvé: <strong>@{verifiedUsername}</strong></p>
                      <p style={{ fontSize: '14px', color: '#666' }}>
                        Entrez votre nouveau code PIN
                      </p>
                    </div>

                    <div className="form-group">
                      <label>Nouveau code PIN (4 chiffres)</label>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        {[0, 1, 2, 3].map((index) => (
                          <input
                            key={`reset-pin-${index}`}
                            id={`reset-pin-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={resetData.newPin[index]}
                            onChange={(e) => handleResetPinChange(index, e.target.value)}
                            onKeyDown={(e) => handleResetPinKeyDown(index, e)}
                            style={{
                              width: '50px',
                              height: '50px',
                              textAlign: 'center',
                              fontSize: '24px',
                              fontWeight: 'bold'
                            }}
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={resetLoading}>
                      {resetLoading ? 'Réinitialisation...' : 'Réinitialiser le PIN'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '10px',
                        background: '#f5f5f5',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Retour
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
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
