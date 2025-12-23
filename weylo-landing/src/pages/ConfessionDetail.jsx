import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import confessionsService from '../services/confessionsService'
import ConfessionCard from '../components/confessions/ConfessionCard'
import '../styles/Confessions.css'

export default function ConfessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { error: showError } = useDialog()
  const [confession, setConfession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadConfession()
  }, [id])

  const loadConfession = async () => {
    try {
      setLoading(true)
      const data = await confessionsService.getConfessionById(id)
      setConfession(data.confession)
      setError(null)
    } catch (err) {
      console.error('❌ Erreur lors du chargement de la confession:', err)
      setError('Impossible de charger cette confession')
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (confessionId) => {
    if (!user) {
      showError('Tu dois être connecté pour liker une confession')
      navigate('/login')
      return
    }

    try {
      const wasLiked = confession.is_liked

      // Optimistic update
      setConfession(prev => ({
        ...prev,
        is_liked: !wasLiked,
        likes_count: wasLiked ? prev.likes_count - 1 : prev.likes_count + 1
      }))

      // API call
      if (wasLiked) {
        await confessionsService.unlikeConfession(confessionId)
      } else {
        await confessionsService.likeConfession(confessionId)
      }
    } catch (err) {
      console.error('❌ Erreur lors du like:', err)
      // Rollback on error
      loadConfession()
    }
  }

  const handleCommentAdded = () => {
    setConfession(prev => ({
      ...prev,
      comments_count: (prev.comments_count || 0) + 1
    }))
  }

  const handleCommentDeleted = () => {
    setConfession(prev => ({
      ...prev,
      comments_count: Math.max((prev.comments_count || 0) - 1, 0)
    }))
  }

  if (loading) {
    return (
      <div className="confession-detail-page">
        <div className="page-header">
          <Link to="/confessions" className="back-link">← Retour aux confessions</Link>
          <h1>Confession</h1>
        </div>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error || !confession) {
    return (
      <div className="confession-detail-page">
        <div className="page-header">
          <Link to="/confessions" className="back-link">← Retour aux confessions</Link>
          <h1>Confession</h1>
        </div>
        <div className="error-state">
          <p>{error || 'Confession non trouvée'}</p>
          <Link to="/confessions" className="btn-primary">
            Voir toutes les confessions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="confession-detail-page">
      <div className="page-header">
        <Link to="/confessions" className="back-link">← Retour aux confessions</Link>
        <h1>Confession</h1>
      </div>

      <div className="confession-detail-container">
        <ConfessionCard
          confession={confession}
          onLike={toggleLike}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          currentUser={user}
        />
      </div>

      {!user && (
        <div className="cta-section">
          <h3>Rejoins Weylo pour partager tes confessions</h3>
          <p>Crée un compte gratuit pour publier et interagir avec les confessions</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">S'inscrire</Link>
            <Link to="/login" className="btn-secondary">Se connecter</Link>
          </div>
        </div>
      )}
    </div>
  )
}
