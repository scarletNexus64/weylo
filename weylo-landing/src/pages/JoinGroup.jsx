import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Users, Loader2, CheckCircle, Globe, Lock, ArrowLeft } from 'lucide-react'
import groupsService from '../services/groupsService'
import '../styles/JoinGroup.css'

export default function JoinGroup() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [manualCode, setManualCode] = useState(inviteCode || '')

  // Rediriger vers login si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      // Stocker le code pour revenir après connexion
      if (inviteCode) {
        sessionStorage.setItem('pendingGroupJoin', inviteCode)
      }
      navigate('/login')
    }
  }, [isAuthenticated, inviteCode, navigate])

  // Récupérer le code en attente après connexion
  useEffect(() => {
    if (isAuthenticated) {
      const pendingCode = sessionStorage.getItem('pendingGroupJoin')
      if (pendingCode && !manualCode) {
        sessionStorage.removeItem('pendingGroupJoin')
        setManualCode(pendingCode)
      }
    }
  }, [isAuthenticated, manualCode])

  const handleJoinGroup = async (e) => {
    if (e) e.preventDefault()

    if (!manualCode.trim()) {
      setError('Veuillez entrer un code d\'invitation')
      return
    }

    setError('')
    setJoining(true)

    try {
      console.log('🔄 Tentative de rejoindre le groupe avec le code:', manualCode.trim())
      const response = await groupsService.joinGroup(manualCode.trim())
      console.log('✅ Groupe rejoint avec succès:', response)
      setSuccess(true)

      // Redirection vers le groupe après 1.5 secondes
      setTimeout(() => {
        navigate(`/groups/${response.group.id}`)
      }, 1500)
    } catch (err) {
      console.error('❌ Erreur rejoindre groupe:', err)
      const errorMessage = err.response?.data?.message || 'Code d\'invitation invalide ou expiré'
      setError(errorMessage)
    } finally {
      setJoining(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="join-group-page">
        <div className="join-container">
          <Loader2 className="spinner" size={48} strokeWidth={2.5} />
          <p>Redirection vers la connexion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="join-group-page">
      <div className="join-container">
        {success ? (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={64} strokeWidth={2} />
            </div>
            <h1>Groupe rejoint !</h1>
            <p>Vous allez être redirigé vers le groupe...</p>
          </div>
        ) : (
          <>
            <div className="join-header">
              <div className="join-icon">
                <Users size={48} strokeWidth={2} />
              </div>
              <h1>Rejoindre un groupe</h1>
              <p>
                {inviteCode
                  ? 'Cliquez sur le bouton pour rejoindre le groupe'
                  : 'Entrez le code d\'invitation pour rejoindre un groupe anonyme'
                }
              </p>
            </div>

            <form onSubmit={handleJoinGroup} className="join-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {inviteCode && (
                <div className="info-box">
                  <Globe size={20} />
                  <p>Code d'invitation détecté: <strong>{manualCode}</strong></p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="inviteCode">Code d'invitation</label>
                <input
                  id="inviteCode"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC12XYZ"
                  maxLength={8}
                  className="code-input"
                  disabled={joining}
                  autoFocus={!inviteCode}
                />
                <p className="input-help">Le code contient 8 caractères</p>
              </div>

              <button
                type="submit"
                className="btn-join"
                disabled={joining || !manualCode.trim()}
              >
                {joining ? (
                  <>
                    <Loader2 className="spinner" size={20} strokeWidth={2.5} />
                    Connexion en cours...
                  </>
                ) : (
                  'Rejoindre le groupe'
                )}
              </button>
            </form>

            <div className="join-info">
              <div className="info-card">
                <Globe className="info-icon" size={24} strokeWidth={2} />
                <div className="info-content">
                  <h3>Anonymat total</h3>
                  <p>Votre identité reste cachée. Seule votre initiale est visible.</p>
                </div>
              </div>
              <div className="info-card">
                <Lock className="info-icon" size={24} strokeWidth={2} />
                <div className="info-content">
                  <h3>Conversations privées</h3>
                  <p>Les messages sont chiffrés et sécurisés.</p>
                </div>
              </div>
            </div>

            <div className="join-footer">
              <button
                onClick={() => navigate('/groups')}
                className="btn-back-to-groups"
              >
                Retour aux groupes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
