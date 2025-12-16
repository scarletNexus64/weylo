import { useState } from 'react'
import '../styles/Confessions.css'

export default function Confessions() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newConfession, setNewConfession] = useState('')
  const [confessions, setConfessions] = useState([
    {
      id: 1,
      content: "J'ai un crush secret sur quelqu'un de ma classe depuis 2 ans mais je n'ai jamais osé lui dire...",
      likes_count: 245,
      is_liked: false,
      created_at: 'Il y a 2 heures',
      author_initial: 'A'
    },
    {
      id: 2,
      content: "Parfois je fais semblant d'être occupé juste pour ne pas sortir avec mes amis. J'adore rester seul chez moi.",
      likes_count: 189,
      is_liked: true,
      created_at: 'Il y a 5 heures',
      author_initial: 'M'
    },
    {
      id: 3,
      content: "Je regrette d'avoir quitté mon ex. C'était la meilleure personne que j'ai jamais rencontrée.",
      likes_count: 421,
      is_liked: false,
      created_at: 'Il y a 1 jour',
      author_initial: 'K'
    },
    {
      id: 4,
      content: "J'ai menti sur mon âge sur mes réseaux sociaux pour avoir l'air plus cool. Personne ne le sait.",
      likes_count: 156,
      is_liked: false,
      created_at: 'Il y a 1 jour',
      author_initial: 'S'
    },
    {
      id: 5,
      content: "Des fois j'aimerais juste tout plaquer et recommencer ma vie ailleurs, loin de tout le monde.",
      likes_count: 567,
      is_liked: true,
      created_at: 'Il y a 2 jours',
      author_initial: 'B'
    },
    {
      id: 6,
      content: "Je suis jaloux du succès de mes amis sur les réseaux sociaux même si je ne le montre jamais.",
      likes_count: 302,
      is_liked: false,
      created_at: 'Il y a 2 jours',
      author_initial: 'L'
    }
  ])

  const toggleLike = (confessionId) => {
    setConfessions(confessions.map(conf => {
      if (conf.id === confessionId) {
        return {
          ...conf,
          is_liked: !conf.is_liked,
          likes_count: conf.is_liked ? conf.likes_count - 1 : conf.likes_count + 1
        }
      }
      return conf
    }))
  }

  const handleCreateConfession = () => {
    if (newConfession.trim().length < 10) {
      alert('Ta confession doit contenir au moins 10 caractères')
      return
    }

    const confession = {
      id: Date.now(),
      content: newConfession,
      likes_count: 0,
      is_liked: false,
      created_at: 'À l\'instant',
      author_initial: 'Moi'
    }

    setConfessions([confession, ...confessions])
    setNewConfession('')
    setShowCreateModal(false)
  }

  return (
    <div className="confessions-page">
      <div className="page-header">
        <h1>Confessions 📢</h1>
        <p>Partage tes secrets anonymement ou découvre ceux des autres</p>
      </div>

      {/* Create Button */}
      <button className="btn-create-confession" onClick={() => setShowCreateModal(true)}>
        ✍️ Créer une confession
      </button>

      {/* Confessions Feed */}
      <div className="confessions-feed">
        {confessions.map(confession => (
          <div key={confession.id} className="confession-card">
            <div className="confession-header">
              <div className="confession-author">
                <div className="author-avatar">{confession.author_initial}</div>
                <div className="author-info">
                  <span className="author-name">Anonyme</span>
                  <span className="confession-time">{confession.created_at}</span>
                </div>
              </div>
            </div>

            <div className="confession-content">
              {confession.content}
            </div>

            <div className="confession-actions">
              <button
                className={`btn-like ${confession.is_liked ? 'liked' : ''}`}
                onClick={() => toggleLike(confession.id)}
              >
                {confession.is_liked ? '❤️' : '🤍'} {confession.likes_count}
              </button>
              <button className="btn-share">
                🔗 Partager
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Confession Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="confession-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle confession</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Ta confession sera postée de façon 100% anonyme. Personne ne saura que c'est toi.
              </p>
              <textarea
                placeholder="Écris ta confession ici... (minimum 10 caractères)"
                value={newConfession}
                onChange={(e) => setNewConfession(e.target.value)}
                maxLength={500}
              />
              <div className="character-count">
                {newConfession.length}/500 caractères
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleCreateConfession}>
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
