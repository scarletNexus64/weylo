import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  Users,
  Settings,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import groupsService from '../services/groupsService'
import websocketService from '../services/websocketService'
import PremiumBadge from '../components/shared/PremiumBadge'
import { useDialog } from '../contexts/DialogContext'
import '../styles/GroupChat.css'

export default function GroupChat() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { error: showError } = useDialog()
  const [group, setGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef(null)

  // Les groupes sont 100% anonymes - pas de révélation d'identité

  useEffect(() => {
    if (!isAuthenticated || !user || !groupId) {
      navigate('/groups')
      return
    }

    // Initialiser WebSocket si pas déjà fait
    const token = localStorage.getItem('weylo_token')
    if (token && user.id && !websocketService.echo) {
      console.log('🔌 [GROUP_CHAT] Initialisation du WebSocket...')
      websocketService.connect(token, user.id)
    }

    loadGroupData()
    loadMessages()
    loadMembers()

    return () => {
      // Cleanup WebSocket subscription
      console.log('🚪 [GROUP_CHAT] Nettoyage - Désabonnement du channel groupe:', groupId)
      websocketService.leaveChannel(`private-group.${groupId}`)
    }
  }, [groupId, isAuthenticated, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `${minutes} min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const loadGroupData = async () => {
    try {
      const response = await groupsService.getGroup(groupId)
      setGroup(response.group)
    } catch (error) {
      console.error('❌ Erreur chargement groupe:', error)
      navigate('/groups')
    }
  }

  const loadMembers = async () => {
    try {
      const response = await groupsService.getMembers(groupId)
      setMembers(response.members || [])
    } catch (error) {
      console.error('❌ Erreur chargement membres:', error)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await groupsService.getMessages(groupId)
      const transformedMessages = response.messages.map(msg => {
        // Afficher l'identité si révélée (premium), sinon "Anonyme"
        let senderName = 'Anonyme'
        let senderAvatar = 'A'

        if (msg.sender_first_name || msg.sender_username) {
          // L'utilisateur a un premium pass - identité révélée
          senderName = msg.sender_username || `${msg.sender_first_name} ${msg.sender_last_name || ''}`.trim()
          senderAvatar = msg.sender_initial || senderName.charAt(0).toUpperCase()
        } else if (msg.sender_name) {
          // Pas premium - anonyme
          senderName = msg.sender_name
          senderAvatar = msg.sender_initial || 'A'
        }

        return {
          id: msg.id,
          content: msg.content,
          is_own: msg.is_own,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          sender_avatar_url: msg.sender_avatar_url,
          type: msg.type,
          time: formatTime(msg.created_at),
          created_at: msg.created_at
        }
      })

      setMessages(transformedMessages)

      // Marquer comme lu
      await groupsService.markAsRead(groupId)

      // S'abonner aux nouveaux messages via WebSocket
      const subscribeToWebSocket = (isConnected) => {
        if (!isConnected) {
          console.log('⏳ [GROUP_CHAT] WebSocket pas encore connecté, attente...')
          return
        }

        console.log('🔔 [GROUP_CHAT] WebSocket connecté, abonnement au channel du groupe:', groupId)

        const channel = websocketService.subscribeToGroupChannel(groupId, {
          onGroupMessageSent: (event) => {
            console.log('📨 [GROUP_CHAT] Événement reçu:', event)

            // Ignorer nos propres messages (déjà ajoutés via optimistic update)
            if (event.sender_id === user.id) {
              console.log('⏩ [GROUP_CHAT] Message de nous-même ignoré (optimistic update déjà fait)')
              return
            }

            // Afficher l'identité si révélée (premium), sinon "Anonyme"
            let senderName = 'Anonyme'
            let senderAvatar = 'A'

            if (event.sender_first_name || event.sender_username) {
              // L'utilisateur a un premium pass - identité révélée
              senderName = event.sender_username || `${event.sender_first_name} ${event.sender_last_name || ''}`.trim()
              senderAvatar = event.sender_initial || senderName.charAt(0).toUpperCase()
            } else if (event.sender_name) {
              // Pas premium - anonyme
              senderName = event.sender_name
              senderAvatar = event.sender_initial || 'A'
            }

            const newMsg = {
              id: event.id,
              content: event.content,
              is_own: false, // Toujours false car on ignore nos propres messages
              sender_name: senderName,
              sender_avatar: senderAvatar,
              sender_avatar_url: event.sender_avatar_url,
              type: event.type,
              time: formatTime(event.created_at),
              created_at: event.created_at
            }

            console.log('✅ [GROUP_CHAT] Ajout du message à la liste:', newMsg)
            setMessages(prev => {
              // Vérifier si le message existe déjà (éviter les doublons)
              const messageExists = prev.some(msg => msg.id === newMsg.id)
              if (messageExists) {
                console.log('⚠️ [GROUP_CHAT] Message déjà présent, ignoré:', newMsg.id)
                return prev
              }

              console.log('📝 [GROUP_CHAT] Messages avant:', prev.length)
              const updated = [...prev, newMsg]
              console.log('📝 [GROUP_CHAT] Messages après:', updated.length)
              return updated
            })
            scrollToBottom()
          }
        })

        if (channel) {
          console.log('✅ [GROUP_CHAT] Channel souscrit:', channel)
        } else {
          console.log('⚠️ [GROUP_CHAT] WebSocket non disponible, les messages fonctionneront sans temps réel')
        }
      }

      // Écouter les changements de connexion et s'abonner quand c'est connecté
      websocketService.onConnectionChange(subscribeToWebSocket)
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error)
    } finally {
      setLoading(false)
      // Scroll vers le bas après que le loading soit terminé et que le DOM soit mis à jour
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      }, 150)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await groupsService.sendMessage(groupId, newMessage)

      // Ajouter immédiatement le message envoyé (optimistic update)
      if (response.message) {
        // Afficher l'identité si révélée (premium), sinon "Anonyme"
        let senderName = 'Anonyme'
        let senderAvatar = 'A'

        if (response.message.sender_first_name || response.message.sender_username) {
          // L'utilisateur a un premium pass - identité révélée
          senderName = response.message.sender_username || `${response.message.sender_first_name} ${response.message.sender_last_name || ''}`.trim()
          senderAvatar = response.message.sender_initial || senderName.charAt(0).toUpperCase()
        } else if (response.message.sender_name) {
          // Pas premium - anonyme
          senderName = response.message.sender_name
          senderAvatar = response.message.sender_initial || 'A'
        }

        const newMsg = {
          id: response.message.id,
          content: response.message.content,
          is_own: true,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          sender_avatar_url: response.message.sender_avatar_url,
          type: response.message.type,
          time: formatTime(response.message.created_at),
          created_at: response.message.created_at
        }
        setMessages(prev => [...prev, newMsg])
      }

      setNewMessage('')
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
      showError('Impossible d\'envoyer le message. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!group && !loading) {
    return (
      <div className="group-chat-page">
        <div className="error-state">
          <MessageCircle size={64} />
          <p>Groupe introuvable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group-chat-page">
      {/* Header */}
      <div className="group-chat-header">
        <button
          onClick={() => navigate('/groups')}
          className="btn-back"
          aria-label="Retour aux groupes"
          type="button"
        >
          <span style={{ fontSize: '24px' }}>←</span>
        </button>
        {group && (
          <>
            <div className="group-avatar-header">
              <Users size={24} strokeWidth={2} />
            </div>
            <div className="group-info-header">
              <h2>{group.name}</h2>
              <p className="group-members-count">
                {group.members_count} {group.members_count > 1 ? 'membres' : 'membre'}
              </p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-header-action"
                aria-label="Partager"
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {loading ? (
          <div className="loading-messages">
            <Loader2 className="spinner" size={32} strokeWidth={2.5} />
            <p>Chargement des messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <MessageCircle size={48} strokeWidth={1.5} />
            <p>Aucun message pour le moment</p>
            <span>Soyez le premier à envoyer un message !</span>
          </div>
        ) : (
          <>
            {messages
              .filter(msg => msg && msg.id && msg.content) // Filtrer les messages null/invalides
              .map(msg => (
                <div
                  key={msg.id}
                  className={`message-wrapper ${msg.is_own ? 'own' : 'other'}`}
                >
                  {!msg.is_own && msg.type !== 'system' && (
                    <div className="message-sender-info">
                      <div className="message-sender-initial">
                        {msg.sender_avatar_url ? (
                          <img src={msg.sender_avatar_url} alt={msg.sender_name} className="sender-avatar-img" />
                        ) : (
                          msg.sender_avatar || 'A'
                        )}
                      </div>
                      <span className="message-sender-name">
                        {msg.sender_name || 'Anonyme'}
                      </span>
                    </div>
                  )}
                  <div className={`message-bubble ${msg.type === 'system' ? 'system' : msg.is_own ? 'own' : 'other'}`}>
                    <p className="message-text">{msg.content}</p>
                    <span className="message-time">{msg.time || ''}</span>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="btn-send"
          aria-label="Envoyer le message"
        >
          {sending ? (
            <Loader2 strokeWidth={2.5} className="spinner" />
          ) : (
            <Send strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && group && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Code d'invitation</h2>
              <button onClick={() => setShowShareModal(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Partagez ce code pour inviter des personnes à rejoindre le groupe
              </p>
              <div className="invite-code-box">
                <p className="invite-code">{group.invite_code}</p>
                <button
                  onClick={copyInviteCode}
                  className="btn-copy-code"
                >
                  {copied ? (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy size={18} strokeWidth={2} />
                      Copier le code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && group && (
        <GroupSettingsModal
          group={group}
          members={members}
          onClose={() => setShowSettings(false)}
          onLeave={async () => {
            try {
              await groupsService.leaveGroup(groupId)
              navigate('/groups')
            } catch (error) {
              console.error('❌ Erreur quitter groupe:', error)
              showError('Impossible de quitter le groupe')
            }
          }}
        />
      )}
    </div>
  )
}

// Group Settings Modal Component
function GroupSettingsModal({ group, members, onClose, onLeave }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Paramètres du groupe</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          {/* Group Info */}
          <div className="settings-section">
            <h3>Informations</h3>
            <div className="info-item">
              <span className="info-label">Nom:</span>
              <span className="info-value">{group.name}</span>
            </div>
            {group.description && (
              <div className="info-item">
                <span className="info-label">Description:</span>
                <span className="info-value">{group.description}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Membres:</span>
              <span className="info-value">{group.members_count} / {group.max_members}</span>
            </div>
          </div>

          {/* Members List */}
          <div className="settings-section">
            <h3>Membres ({members.length})</h3>
            <div className="members-list">
              {members
                .filter(member => member && member.id) // Filtrer les membres null/supprimés
                .map(member => {
                  // Afficher l'identité si révélée (premium), sinon "Anonyme"
                  let displayName = 'Anonyme'
                  let avatarContent = 'A'
                  let avatarUrl = null

                  if (member.is_identity_revealed) {
                    // L'utilisateur a un premium pass - identité révélée
                    displayName = member.username || `${member.first_name || ''} ${member.last_name || ''}`.trim()
                    avatarContent = member.initial || displayName.charAt(0).toUpperCase()
                    avatarUrl = member.avatar_url
                  } else {
                    // Pas premium - anonyme
                    displayName = member.display_name || 'Anonyme'
                    avatarContent = member.initial || 'A'
                  }

                  return (
                    <div key={member.id} className="member-item">
                      <div className="member-avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="member-avatar-img" />
                        ) : (
                          avatarContent
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">
                          {displayName}
                        </span>
                        {member.role === 'admin' && (
                          <span className="member-badge">Créateur</span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Danger Zone */}
          {!group.is_creator && (
            <div className="settings-section danger-zone">
              <button onClick={onLeave} className="btn-danger">
                Quitter le groupe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
