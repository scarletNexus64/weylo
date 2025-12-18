import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Users, Lock, Globe, MessageCircle, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import groupsService from '../services/groupsService'
import '../styles/Groups.css'

export default function Groups() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('list') // 'list', 'create', 'join'

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    loadGroups()
  }, [isAuthenticated, user])

  const loadGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await groupsService.getGroups()
      console.log('📦 Groupes chargés:', response)

      // S'assurer que groups est un tableau
      const groupsList = Array.isArray(response.groups) ? response.groups : []
      setGroups(groupsList)
    } catch (error) {
      console.error('❌ Erreur chargement groupes:', error)
      setError('Impossible de charger les groupes')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (!isAuthenticated) {
    return (
      <div className="groups-page">
        <div className="auth-required">
          <div className="auth-required-content">
            <Lock className="auth-required-icon" />
            <h3>Authentification requise</h3>
            <p>Veuillez vous connecter pour accéder aux groupes</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="groups-page">
      {/* Header */}
      <div className="groups-header">
        <div className="groups-title">
          <div className="header-icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Groupes</h1>
            {activeView === 'list' && (
              <p>{groups.length} {groups.length > 1 ? 'groupes' : 'groupe'}</p>
            )}
          </div>
        </div>
        {activeView !== 'list' && (
          <button onClick={() => setActiveView('list')} className="btn-back">
            Retour
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Chargement des groupes...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle className="error-icon" size={40} />
          <p className="error-text">{error}</p>
          <button onClick={loadGroups} className="btn-retry">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Vue Liste */}
          {activeView === 'list' && (
            <>
              {groups.length === 0 ? (
                /* Pas de groupes - Grande interface d'options */
                <>
                  <div className="options-grid">
                    <div className="option-card create-card" onClick={() => setActiveView('create')}>
                      <div className="option-icon">
                        <Plus size={32} strokeWidth={2} />
                      </div>
                      <h3>Créer un groupe</h3>
                      <p>Créez votre propre groupe anonyme et invitez vos amis</p>
                    </div>

                    <div className="option-card join-card" onClick={() => setActiveView('join')}>
                      <div className="option-icon">
                        <UserPlus size={32} strokeWidth={2} />
                      </div>
                      <h3>Rejoindre un groupe</h3>
                      <p>Utilisez un code d'invitation pour rejoindre un groupe</p>
                    </div>
                  </div>
                </>
              ) : (
                /* A des groupes - Interface compacte */
                <>
                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <button className="quick-action-btn create" onClick={() => setActiveView('create')}>
                      <Plus size={20} strokeWidth={2.5} />
                      <span>Créer un groupe</span>
                    </button>
                    <button className="quick-action-btn join" onClick={() => setActiveView('join')}>
                      <UserPlus size={20} strokeWidth={2.5} />
                      <span>Rejoindre</span>
                    </button>
                  </div>

                  {/* Groups List */}
                  <div className="groups-list">
                    {groups.map(group => (
                      <div
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="group-card"
                      >
                        <div className="group-avatar">
                          <Users size={24} strokeWidth={2} />
                        </div>
                        <div className="group-content">
                          <div className="group-header">
                            <div className="group-name-wrapper">
                              <h3 className="group-name">{group.name}</h3>
                              {group.is_public ? (
                                <Globe size={14} className="visibility-icon public" />
                              ) : (
                                <Lock size={14} className="visibility-icon private" />
                              )}
                            </div>
                            {group.last_message_at && (
                              <span className="group-time">{formatTime(group.last_message_at)}</span>
                            )}
                          </div>
                          <div className="group-footer">
                            <div className="group-stats">
                              <span className="stat-item">
                                <Users size={14} strokeWidth={2} />
                                {group.members_count}
                              </span>
                              <span className="stat-item">
                                <MessageCircle size={14} strokeWidth={2} />
                                {group.messages_count || 0}
                              </span>
                            </div>
                            {group.unread_count > 0 && (
                              <span className="unread-count">
                                {group.unread_count > 9 ? '9+' : group.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Vue Créer un groupe */}
          {activeView === 'create' && (
            <CreateGroupView
              onCreated={(newGroup) => {
                setActiveView('list')
                loadGroups()
                navigate(`/groups/${newGroup.id}`)
              }}
            />
          )}

          {/* Vue Rejoindre un groupe */}
          {activeView === 'join' && (
            <JoinGroupView
              onJoined={(joinedGroup) => {
                setActiveView('list')
                loadGroups()
                navigate(`/groups/${joinedGroup.id}`)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

// Create Group View Component
function CreateGroupView({ onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    max_members: 50
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Le nom du groupe est requis')
      return
    }

    try {
      setCreating(true)
      const response = await groupsService.createGroup(formData)
      console.log('✅ Groupe créé:', response)
      onCreated(response.group)
    } catch (err) {
      console.error('❌ Erreur création groupe:', err)
      setError(err.response?.data?.message || 'Erreur lors de la création du groupe')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-icon create">
          <Plus size={28} strokeWidth={2} />
        </div>
        <h2>Créer un nouveau groupe</h2>
        <p>Créez votre groupe anonyme et invitez vos amis à vous rejoindre</p>
      </div>

      <form onSubmit={handleSubmit} className="view-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Nom du groupe *</label>
          <input
            id="name"
            type="text"
            placeholder="Ex: Groupe d'amis"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            maxLength={100}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Décrivez votre groupe..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={500}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="is_public">Visibilité</label>
          <select
            id="is_public"
            value={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.value === 'true' })}
          >
            <option value="false">Privé (sur invitation)</option>
            <option value="true">Public</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="max_members">Nombre maximum de membres</label>
          <input
            id="max_members"
            type="number"
            min={2}
            max={200}
            value={formData.max_members}
            onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
          />
        </div>

        <button type="submit" className="btn-submit" disabled={creating}>
          {creating ? (
            <>
              <Loader2 className="spinner" size={20} strokeWidth={2.5} />
              Création en cours...
            </>
          ) : (
            <>
              <Plus size={20} strokeWidth={2.5} />
              Créer le groupe
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// Join Group View Component
function JoinGroupView({ onJoined }) {
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!inviteCode.trim()) {
      setError('Le code d\'invitation est requis')
      return
    }

    try {
      setJoining(true)
      const response = await groupsService.joinGroup(inviteCode.trim())
      console.log('✅ Groupe rejoint:', response)
      onJoined(response.group)
    } catch (err) {
      console.error('❌ Erreur rejoindre groupe:', err)
      setError(err.response?.data?.message || 'Code d\'invitation invalide ou groupe introuvable')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-icon join">
          <UserPlus size={28} strokeWidth={2} />
        </div>
        <h2>Rejoindre un groupe</h2>
        <p>Entrez le code d'invitation que vous avez reçu pour rejoindre un groupe anonyme</p>
      </div>

      <form onSubmit={handleSubmit} className="view-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="invite_code">Code d'invitation *</label>
          <input
            id="invite_code"
            type="text"
            placeholder="Ex: ABC123XYZ"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={20}
            required
            autoFocus
            className="invite-code-input"
          />
          <small className="form-hint">
            Le code est généralement composé de lettres et chiffres
          </small>
        </div>

        <button type="submit" className="btn-submit" disabled={joining}>
          {joining ? (
            <>
              <Loader2 className="spinner" size={20} strokeWidth={2.5} />
              Connexion en cours...
            </>
          ) : (
            <>
              <UserPlus size={20} strokeWidth={2.5} />
              Rejoindre le groupe
            </>
          )}
        </button>
      </form>
    </div>
  )
}
