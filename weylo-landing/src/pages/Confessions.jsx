import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import confessionsService from '../services/confessionsService'
import ConfessionCard from '../components/confessions/ConfessionCard'
import '../styles/Confessions.css'

export default function Confessions() {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newConfession, setNewConfession] = useState('')
  const [confessions, setConfessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    loadConfessions()
  }, [])

  const loadConfessions = async () => {
    try {
      setLoading(true)
      const data = await confessionsService.getPublicConfessions(1, 20)
      const confessionsData = data.confessions.data || data.confessions
      setConfessions(confessionsData)
      setHasMore(data.meta?.current_page < data.meta?.last_page)
      setPage(1)
      setError(null)
      console.log('✅ Confessions chargées:', confessionsData)
    } catch (err) {
      console.error('❌ Erreur lors du chargement des confessions:', err)
      setError('Impossible de charger les confessions')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const data = await confessionsService.getPublicConfessions(nextPage, 20)
      const newConfessions = data.confessions.data || data.confessions
      setConfessions(prev => [...prev, ...newConfessions])
      setHasMore(data.meta?.current_page < data.meta?.last_page)
      setPage(nextPage)
    } catch (err) {
      console.error('❌ Erreur lors du chargement de plus de confessions:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleCreateConfession = async () => {
    if (newConfession.trim().length < 10) {
      alert('Ta confession doit contenir au moins 10 caractères')
      return
    }

    if (!user) {
      alert('Tu dois être connecté pour créer une confession')
      return
    }

    try {
      await confessionsService.createConfession({
        content: newConfession,
        type: 'public'
      })

      setNewConfession('')
      setShowCreateModal(false)
      alert('Confession créée ! Elle sera publiée après modération.')
      loadConfessions()
    } catch (err) {
      console.error('❌ Erreur lors de la création:', err)
      alert('Impossible de créer la confession')
    }
  }

  const toggleLike = async (confessionId) => {
    if (!user) {
      alert('Tu dois être connecté pour liker une confession')
      return
    }

    try {
      // Trouver l'état actuel AVANT l'update optimiste
      const confession = confessions.find(c => c.id === confessionId)
      const wasLiked = confession.is_liked

      // Optimistic update
      setConfessions(prev => prev.map(conf => {
        if (conf.id === confessionId) {
          return {
            ...conf,
            is_liked: !wasLiked,
            likes_count: wasLiked ? conf.likes_count - 1 : conf.likes_count + 1
          }
        }
        return conf
      }))

      // API call avec la bonne logique
      if (wasLiked) {
        await confessionsService.unlikeConfession(confessionId)
      } else {
        await confessionsService.likeConfession(confessionId)
      }
    } catch (err) {
      console.error('❌ Erreur lors du like:', err)
      // Rollback on error
      loadConfessions()
    }
  }

  const handleCommentAdded = (confessionId) => {
    console.log('Commentaire ajouté à la confession:', confessionId)
    // Mettre à jour le count des commentaires
    setConfessions(prev => prev.map(conf => {
      if (conf.id === confessionId) {
        return {
          ...conf,
          comments_count: (conf.comments_count || 0) + 1
        }
      }
      return conf
    }))
  }

  const handleCommentDeleted = (confessionId) => {
    console.log('Commentaire supprimé de la confession:', confessionId)
    // Décrémenter le count des commentaires
    setConfessions(prev => prev.map(conf => {
      if (conf.id === confessionId) {
        return {
          ...conf,
          comments_count: Math.max((conf.comments_count || 0) - 1, 0)
        }
      }
      return conf
    }))
  }

  if (loading) {
    return (
      <div className="confessions-page">
        <div className="page-header">
          <h1>Confessions 📢</h1>
          <p>Chargement des confessions...</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="confessions-page">
        <div className="page-header">
          <h1>Confessions 📢</h1>
          <p>{error}</p>
        </div>
        <button onClick={loadConfessions} className="btn-retry">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="confessions-page">
      <div className="page-header">
        <h1>Confessions 📢</h1>
        <p>Partage tes secrets anonymement ou découvre ceux des autres</p>
      </div>

      {/* Create Button */}
      {user && (
        <button className="btn-create-confession" onClick={() => setShowCreateModal(true)}>
          ✍️ Créer une confession
        </button>
      )}

      {/* Confessions Feed */}
      {confessions.length === 0 ? (
        <div className="empty-state">
          <p>Aucune confession pour le moment</p>
          <p className="subtitle">Sois le premier à partager</p>
        </div>
      ) : (
        <>
          <div className="confessions-feed">
            {confessions.map(confession => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onLike={toggleLike}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
                currentUser={user}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-load-more"
              >
                {loadingMore ? 'Chargement...' : 'Charger plus'}
              </button>
            </div>
          )}
        </>
      )}

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
