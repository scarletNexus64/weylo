import { useState } from 'react'
import { Copy, Check, Users, Lock, Eye, Coins } from 'lucide-react'
import '../styles/Chat.css'

export default function Chat() {
  const [activeTab, setActiveTab] = useState('dm') // 'dm' or 'groups'
  const [selectedChat, setSelectedChat] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showRevealModal, setShowRevealModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId)
    setSelectedGroup(null)
    setIsChatOpen(true)
  }

  const handleSelectGroup = (groupId) => {
    setSelectedGroup(groupId)
    setSelectedChat(null)
    setIsChatOpen(true)
  }

  const handleBackToList = () => {
    setIsChatOpen(false)
  }

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      alert('Veuillez entrer un nom pour le groupe')
      return
    }
    alert(`Groupe "${groupName}" créé avec succès !`)
    setShowCreateGroup(false)
    setGroupName('')
  }

  const copyGroupLink = (groupLink) => {
    navigator.clipboard.writeText(groupLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleRevealIdentity = () => {
    alert(`Paiement de 500 FCFA effectué pour révéler ${selectedMember.anonymous_name}`)
    setShowRevealModal(false)
    setSelectedMember(null)
  }

  const conversations = [
    {
      id: 1,
      contact_name: 'Aminata K.',
      contact_avatar: 'A',
      last_message: 'Hey, comment vas-tu ?',
      last_message_time: 'Il y a 5 min',
      unread_count: 2,
      streak_days: 15,
      is_online: true
    },
    {
      id: 2,
      contact_name: 'Ibrahim M.',
      contact_avatar: 'I',
      last_message: 'On se voit ce soir ?',
      last_message_time: 'Il y a 1h',
      unread_count: 0,
      streak_days: 42,
      is_online: false
    },
    {
      id: 3,
      contact_name: 'Fatou D.',
      contact_avatar: 'F',
      last_message: 'Merci beaucoup ! 🙏',
      last_message_time: 'Il y a 3h',
      unread_count: 0,
      streak_days: 7,
      is_online: true
    },
    {
      id: 4,
      contact_name: 'Moussa S.',
      contact_avatar: 'M',
      last_message: 'Tu as vu le match hier ?',
      last_message_time: 'Hier',
      unread_count: 1,
      streak_days: 3,
      is_online: false
    }
  ]

  // Anonymous Groups Data
  const anonymousGroups = [
    {
      id: 1,
      name: 'Groupe Amis 🎭',
      members_count: 12,
      is_anonymous: true,
      link: 'https://weylo.app/g/abc123',
      created_at: 'Il y a 2 jours',
      last_activity: 'Il y a 5 min'
    },
    {
      id: 2,
      name: 'Questions Anonymes 💬',
      members_count: 24,
      is_anonymous: true,
      link: 'https://weylo.app/g/xyz789',
      created_at: 'Il y a 1 semaine',
      last_activity: 'Il y a 1h'
    },
    {
      id: 3,
      name: 'Confessions 🔒',
      members_count: 8,
      is_anonymous: true,
      link: 'https://weylo.app/g/def456',
      created_at: 'Il y a 3 jours',
      last_activity: 'Il y a 30 min'
    }
  ]

  // Group Messages & Members
  const groupData = {
    1: {
      members: [
        { id: 1, anonymous_name: 'Papillon Bleu 🦋', is_revealed: false, real_name: 'Aminata K.', joined_at: 'Il y a 2 jours' },
        { id: 2, anonymous_name: 'Tigre Doré 🐯', is_revealed: true, real_name: 'Ibrahim M.', joined_at: 'Il y a 2 jours' },
        { id: 3, anonymous_name: 'Étoile Brillante ⭐', is_revealed: false, real_name: 'Fatou D.', joined_at: 'Il y a 1 jour' },
        { id: 4, anonymous_name: 'Dragon Rouge 🐉', is_revealed: false, real_name: 'Moussa S.', joined_at: 'Il y a 1 jour' }
      ],
      messages: [
        { id: 1, content: 'Salut tout le monde ! 👋', sender: 'Papillon Bleu 🦋', time: '14:30', is_mine: false },
        { id: 2, content: 'Hey ! Comment ça va ?', sender: 'Moi', time: '14:32', is_mine: true },
        { id: 3, content: 'Quelqu\'un veut jouer ?', sender: 'Dragon Rouge 🐉', time: '14:35', is_mine: false },
        { id: 4, content: 'Oui moi ! 🎮', sender: 'Tigre Doré 🐯', time: '14:40', is_mine: false }
      ]
    },
    2: {
      members: [
        { id: 1, anonymous_name: 'Loup Solitaire 🐺', is_revealed: false, real_name: 'Karim B.', joined_at: 'Il y a 1 semaine' },
        { id: 2, anonymous_name: 'Phénix 🔥', is_revealed: false, real_name: 'Aïcha T.', joined_at: 'Il y a 1 semaine' }
      ],
      messages: [
        { id: 1, content: 'Question: Quel est votre rêve ?', sender: 'Loup Solitaire 🐺', time: '10:00', is_mine: false },
        { id: 2, content: 'Voyager autour du monde ! 🌍', sender: 'Moi', time: '10:05', is_mine: true }
      ]
    },
    3: {
      members: [
        { id: 1, anonymous_name: 'Ombre Mystérieuse 👻', is_revealed: false, real_name: 'Sarah L.', joined_at: 'Il y a 3 jours' },
        { id: 2, anonymous_name: 'Chat Noir 🐱', is_revealed: false, real_name: 'Youssef A.', joined_at: 'Il y a 2 jours' }
      ],
      messages: [
        { id: 1, content: 'J\'ai une confession à faire...', sender: 'Ombre Mystérieuse 👻', time: '16:00', is_mine: false },
        { id: 2, content: 'On t\'écoute !', sender: 'Moi', time: '16:02', is_mine: true }
      ]
    }
  }

  const messages = {
    1: [
      { id: 1, content: 'Salut ! Comment ça va ?', is_mine: false, time: '10:30' },
      { id: 2, content: 'Ça va super bien merci ! Et toi ?', is_mine: true, time: '10:32' },
      { id: 3, content: 'Très bien aussi ! Tu fais quoi aujourd\'hui ?', is_mine: false, time: '10:35' },
      { id: 4, content: 'Je révise pour mes examens 📚', is_mine: true, time: '10:40' },
      { id: 5, content: 'Hey, comment vas-tu ?', is_mine: false, time: '14:55' }
    ],
    2: [
      { id: 1, content: 'Yo ! Ça va ?', is_mine: true, time: '09:00' },
      { id: 2, content: 'Ouais tranquille ! On se voit ce soir ?', is_mine: false, time: '09:05' }
    ],
    3: [
      { id: 1, content: 'Merci pour ton aide hier !', is_mine: false, time: '11:20' },
      { id: 2, content: 'De rien ! N\'hésite pas si tu as besoin', is_mine: true, time: '11:25' },
      { id: 3, content: 'Merci beaucoup ! 🙏', is_mine: false, time: '11:30' }
    ],
    4: [
      { id: 1, content: 'Tu as vu le match hier ?', is_mine: false, time: 'Hier 22:30' }
    ]
  }

  const currentConversation = conversations.find(conv => conv.id === selectedChat)
  const currentMessages = messages[selectedChat] || []
  const currentGroup = anonymousGroups.find(group => group.id === selectedGroup)
  const currentGroupData = groupData[selectedGroup] || { members: [], messages: [] }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real app, send message to backend
      alert('Message envoyé : ' + newMessage)
      setNewMessage('')
    }
  }

  const getStreakEmoji = (days) => {
    if (days >= 30) return '🔥🔥🔥'
    if (days >= 10) return '🔥🔥'
    if (days >= 3) return '🔥'
    return ''
  }

  return (
    <div className="chat-page">
      <div className={`chat-container ${isChatOpen ? 'chat-open' : ''}`}>
        {/* Conversations List */}
        <div className="conversations-list">
          <div className="conversations-header">
            <h2>Messages 💬</h2>
            <button
              className="btn-new-chat"
              onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : null}
            >
              {activeTab === 'groups' ? <Users size={20} /> : '✍️'}
            </button>
          </div>

          {/* Tabs */}
          <div className="chat-tabs">
            <button
              className={`chat-tab ${activeTab === 'dm' ? 'active' : ''}`}
              onClick={() => setActiveTab('dm')}
            >
              <span>💬 DM</span>
            </button>
            <button
              className={`chat-tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <span>🎭 Groupes</span>
              {anonymousGroups.length > 0 && (
                <span className="tab-badge">{anonymousGroups.length}</span>
              )}
            </button>
          </div>

          {/* DM Conversations */}
          {activeTab === 'dm' && (
            <div className="conversations-items">
              {conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedChat === conv.id ? 'active' : ''}`}
                onClick={() => handleSelectChat(conv.id)}
              >
                <div className="conversation-avatar-wrapper">
                  <div className="conversation-avatar">{conv.contact_avatar}</div>
                  {conv.is_online && <div className="online-indicator"></div>}
                </div>

                <div className="conversation-info">
                  <div className="conversation-top">
                    <span className="conversation-name">{conv.contact_name}</span>
                    <span className="conversation-time">{conv.last_message_time}</span>
                  </div>
                  <div className="conversation-bottom">
                    <span className="conversation-last-message">{conv.last_message}</span>
                    {conv.unread_count > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                </div>

                {conv.streak_days > 0 && (
                  <div className="streak-indicator">
                    {getStreakEmoji(conv.streak_days)} {conv.streak_days}
                  </div>
                )}
              </div>
            ))}
            </div>
          )}

          {/* Anonymous Groups List */}
          {activeTab === 'groups' && (
            <div className="conversations-items">
              {anonymousGroups.map(group => (
                <div
                  key={group.id}
                  className={`conversation-item group-item ${selectedGroup === group.id ? 'active' : ''}`}
                  onClick={() => handleSelectGroup(group.id)}
                >
                  <div className="conversation-avatar-wrapper">
                    <div className="conversation-avatar group-avatar">
                      <Users size={24} />
                    </div>
                    <div className="anonymous-indicator">
                      <Lock size={12} />
                    </div>
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-top">
                      <span className="conversation-name">{group.name}</span>
                      <span className="conversation-time">{group.last_activity}</span>
                    </div>
                    <div className="conversation-bottom">
                      <span className="conversation-last-message">
                        {group.members_count} membres • Anonyme
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {anonymousGroups.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🎭</div>
                  <p>Aucun groupe anonyme</p>
                  <button className="btn-create-first" onClick={() => setShowCreateGroup(true)}>
                    Créer mon premier groupe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {/* DM Chat View */}
          {currentConversation && !currentGroup ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="btn-back-mobile" onClick={handleBackToList}>←</button>
                <div className="chat-contact-info">
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar">{currentConversation.contact_avatar}</div>
                    {currentConversation.is_online && <div className="online-indicator"></div>}
                  </div>
                  <div>
                    <h3>{currentConversation.contact_name}</h3>
                    <span className="chat-status">
                      {currentConversation.is_online ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                </div>

                {currentConversation.streak_days > 0 && (
                  <div className="streak-badge">
                    <span className="streak-emoji">{getStreakEmoji(currentConversation.streak_days)}</span>
                    <div className="streak-info">
                      <span className="streak-number">{currentConversation.streak_days}</span>
                      <span className="streak-label">jours</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="messages-area">
                {currentMessages.map(msg => (
                  <div key={msg.id} className={`message ${msg.is_mine ? 'mine' : 'theirs'}`}>
                    <div className="message-bubble">
                      <p>{msg.content}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <button className="btn-attach">📎</button>
                <input
                  type="text"
                  placeholder="Écris ton message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="btn-send" onClick={handleSendMessage}>
                  ➤
                </button>
              </div>
            </>
          ) : currentGroup ? (
            <>
              {/* Group Chat View */}
              <div className="chat-header group-header">
                <button className="btn-back-mobile" onClick={handleBackToList}>←</button>
                <div className="chat-contact-info">
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar group-avatar">
                      <Users size={24} />
                    </div>
                  </div>
                  <div>
                    <h3>{currentGroup.name}</h3>
                    <span className="chat-status">
                      {currentGroupData.members.length} membres • Tous anonymes
                    </span>
                  </div>
                </div>

                <button
                  className="btn-share-link"
                  onClick={() => copyGroupLink(currentGroup.link)}
                  title="Copier le lien du groupe"
                >
                  {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              {/* Group Members Panel */}
              <div className="group-members-panel">
                <h4><Users size={16} /> Membres ({currentGroupData.members.length})</h4>
                <div className="members-list">
                  {currentGroupData.members.map(member => (
                    <div key={member.id} className="member-item">
                      <div className="member-avatar">{member.anonymous_name.charAt(0)}</div>
                      <div className="member-info">
                        <span className="member-name">
                          {member.is_revealed ? member.real_name : member.anonymous_name}
                        </span>
                        <span className="member-joined">{member.joined_at}</span>
                      </div>
                      {!member.is_revealed && (
                        <button
                          className="btn-reveal"
                          onClick={() => {
                            setSelectedMember(member)
                            setShowRevealModal(true)
                          }}
                        >
                          <Eye size={14} /> 500 FCFA
                        </button>
                      )}
                      {member.is_revealed && (
                        <span className="revealed-badge">Révélé</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Messages */}
              <div className="messages-area group-messages">
                {currentGroupData.messages.map(msg => (
                  <div key={msg.id} className={`message ${msg.is_mine ? 'mine' : 'theirs'}`}>
                    <div className="message-bubble">
                      {!msg.is_mine && <div className="message-sender">{msg.sender}</div>}
                      <p>{msg.content}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <button className="btn-attach">📎</button>
                <input
                  type="text"
                  placeholder="Message anonyme..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="btn-send" onClick={handleSendMessage}>
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">{activeTab === 'groups' ? '🎭' : '💬'}</div>
              <h3>
                {activeTab === 'groups' ? 'Sélectionne un groupe' : 'Sélectionne une conversation'}
              </h3>
              <p>
                {activeTab === 'groups'
                  ? 'Choisis un groupe anonyme ou crée-en un nouveau'
                  : 'Choisis une conversation pour commencer à discuter'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="streak-info-card">
        {activeTab === 'dm' ? (
          <>
            <h3>Système de Flammes 🔥</h3>
            <p>Discute chaque jour avec tes amis pour maintenir votre streak !</p>
            <div className="streak-levels">
              <div className="streak-level">
                <span className="level-emoji">🔥</span>
                <span className="level-text">3-9 jours</span>
              </div>
              <div className="streak-level">
                <span className="level-emoji">🔥🔥</span>
                <span className="level-text">10-29 jours</span>
              </div>
              <div className="streak-level">
                <span className="level-emoji">🔥🔥🔥</span>
                <span className="level-text">30+ jours</span>
              </div>
            </div>
            <p className="streak-tip">
              💡 <strong>Astuce :</strong> Envoie au moins un message par jour pour garder ton streak !
            </p>
          </>
        ) : (
          <>
            <h3>Groupes Anonymes 🎭</h3>
            <p>Crée des espaces où tout le monde peut s'exprimer librement sans révéler son identité.</p>
            <div className="info-features">
              <div className="info-feature">
                <Lock size={20} />
                <div>
                  <strong>100% Anonyme</strong>
                  <p>Tous les membres sont anonymes par défaut</p>
                </div>
              </div>
              <div className="info-feature">
                <Eye size={20} />
                <div>
                  <strong>Révéler sur demande</strong>
                  <p>Payez 500 FCFA pour voir qui se cache derrière</p>
                </div>
              </div>
              <div className="info-feature">
                <Users size={20} />
                <div>
                  <strong>Partage facile</strong>
                  <p>Invite tes amis avec un lien unique</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="modal-content create-group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎭 Créer un groupe anonyme</h3>
              <button className="btn-close" onClick={() => setShowCreateGroup(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom du groupe</label>
                <input
                  type="text"
                  placeholder="Ex: Mes amis proches 🎭"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="info-box">
                <Lock size={16} />
                <p>
                  <strong>Groupe 100% anonyme</strong><br />
                  Tous les membres auront un nom anonyme généré automatiquement.
                  Tu pourras partager le lien pour inviter des gens.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateGroup(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleCreateGroup}>
                Créer le groupe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Identity Modal */}
      {showRevealModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowRevealModal(false)}>
          <div className="modal-content reveal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👁️ Révéler l'identité</h3>
              <button className="btn-close" onClick={() => setShowRevealModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="reveal-preview">
                <div className="reveal-avatar">{selectedMember.anonymous_name.charAt(0)}</div>
                <h4>{selectedMember.anonymous_name}</h4>
                <p className="reveal-question">Qui se cache derrière ce masque ?</p>
              </div>
              <div className="reveal-pricing">
                <Coins size={24} className="coins-icon" />
                <div className="pricing-info">
                  <span className="price">500 FCFA</span>
                  <span className="price-label">Paiement unique</span>
                </div>
              </div>
              <div className="warning-box">
                ⚠️ Une fois révélé, tu ne peux pas annuler. L'identité réelle sera visible uniquement pour toi.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRevealModal(false)}>
                Annuler
              </button>
              <button className="btn-submit btn-pay" onClick={handleRevealIdentity}>
                <Coins size={16} /> Payer 500 FCFA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
