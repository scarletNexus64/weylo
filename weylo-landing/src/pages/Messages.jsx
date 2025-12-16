import { useState } from 'react'
import '../styles/Messages.css'

export default function Messages() {
  const [filter, setFilter] = useState('all')

  const mockMessages = [
    { id: 1, content: 'Tu es vraiment incroyable ! 😊', read: false, revealed: false, sender_initial: 'A', created_at: '2024-12-15' },
    { id: 2, content: 'J\'adore ton style !', read: true, revealed: false, sender_initial: 'M', created_at: '2024-12-14' },
    { id: 3, content: 'Tu es ma source d\'inspiration', read: true, revealed: true, sender_name: 'Sarah K.', created_at: '2024-12-13' },
    { id: 4, content: 'Continue comme ça !', read: false, revealed: false, sender_initial: 'J', created_at: '2024-12-12' },
  ]

  const filteredMessages = mockMessages.filter(msg => {
    if (filter === 'unread') return msg.read === false
    if (filter === 'revealed') return msg.revealed
    return true
  })

  const unreadCount = mockMessages.filter(m => m.read === false).length
  const revealedCount = mockMessages.filter(m => m.revealed).length

  return (
    <div className="messages-page">
      <div className="page-header">
        <h1>Mes Messages 💌</h1>
        <p>Découvre ce que tes amis pensent de toi</p>
      </div>

      <div className="messages-filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tous ({mockMessages.length})
        </button>
        <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
          Non lus ({unreadCount})
        </button>
        <button className={filter === 'revealed' ? 'active' : ''} onClick={() => setFilter('revealed')}>
          Révélés ({revealedCount})
        </button>
      </div>

      <div className="messages-list">
        {filteredMessages.map(message => (
          <div key={message.id} className={`message-card ${message.read === false ? 'unread' : ''}`}>
            <div className="message-header">
              <div className="message-sender">
                {message.revealed ? (
                  <>
                    <div className="sender-avatar revealed">{message.sender_name[0]}</div>
                    <span>{message.sender_name}</span>
                  </>
                ) : (
                  <>
                    <div className="sender-avatar">{message.sender_initial}</div>
                    <span>Anonyme</span>
                  </>
                )}
              </div>
              <span className="message-date">{message.created_at}</span>
            </div>

            <div className="message-content">
              {message.content}
            </div>

            <div className="message-actions">
              {message.revealed === false && (
                <button className="btn-reveal">
                  🔓 Révéler l'identité (450 FCFA)
                </button>
              )}
              <button className="btn-reply">💬 Répondre</button>
              <button className="btn-delete">🗑️ Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
