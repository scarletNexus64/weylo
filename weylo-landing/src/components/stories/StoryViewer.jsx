import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import storiesService from '../../services/storiesService'
import './StoryViewer.css'

const StoryViewer = ({ username, allStories = [], currentUserIndex = 0, onClose, onNextUser }) => {
  const { user } = useAuth()
  const [userStories, setUserStories] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    loadUserStories()
    setCurrentIndex(0) // Réinitialiser à la première story quand on change d'utilisateur
    setProgress(0)
  }, [username])

  useEffect(() => {
    if (userStories.length > 0 && !loading) {
      startStoryTimer()
      markCurrentStoryAsViewed()
    }

    return () => {
      clearStoryTimer()
    }
  }, [currentIndex, userStories, loading, isPaused])

  const loadUserStories = async () => {
    try {
      setLoading(true)
      const data = await storiesService.getUserStories(username)
      setUserStories(data.stories || [])
      setError(null)
    } catch (err) {
      console.error('Erreur chargement stories utilisateur:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement des stories')
    } finally {
      setLoading(false)
    }
  }

  const markCurrentStoryAsViewed = async () => {
    const story = userStories[currentIndex]
    if (story && story.user && story.user.id !== user?.id) {
      try {
        await storiesService.markAsViewed(story.id)
      } catch (err) {
        console.error('Erreur marquage story comme vue:', err)
      }
    }
  }

  const startStoryTimer = () => {
    if (isPaused || !userStories[currentIndex]) return

    clearStoryTimer()
    setProgress(0)

    const story = userStories[currentIndex]
    const duration = story?.duration || 5
    const interval = 50 // Mettre à jour toutes les 50ms
    const increment = (100 / (duration * 1000)) * interval

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          // Nettoyer l'interval AVANT de passer à la story suivante
          clearStoryTimer()
          // Utiliser setTimeout pour éviter les problèmes de timing
          setTimeout(() => goToNextStory(), 100)
          return 100
        }
        return newProgress
      })
    }, interval)
  }

  const clearStoryTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const goToNextStory = () => {
    clearStoryTimer()
    if (currentIndex < userStories.length - 1) {
      // Passer à la story suivante du même utilisateur
      console.log(`📖 Story ${currentIndex + 1}/${userStories.length} de @${username}`)
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      // Toutes les stories de cet utilisateur sont terminées
      // Passer à l'utilisateur suivant
      const nextUserIndex = currentUserIndex + 1
      console.log(`✅ Toutes les stories de @${username} vues. User suivant: ${nextUserIndex}/${allStories.length}`)
      if (onNextUser && nextUserIndex < allStories.length) {
        onNextUser(nextUserIndex)
      } else {
        // Plus d'utilisateurs, fermer le viewer
        console.log('🏁 Toutes les stories terminées, fermeture du viewer')
        onClose()
      }
    }
  }

  const goToPreviousStory = () => {
    clearStoryTimer()
    if (currentIndex > 0) {
      // Revenir à la story précédente du même utilisateur
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    } else {
      // C'est la première story, passer à l'utilisateur précédent
      const prevUserIndex = currentUserIndex - 1
      if (onNextUser && prevUserIndex >= 0) {
        onNextUser(prevUserIndex)
      }
      // Sinon on ne fait rien (on reste sur la première story)
    }
  }

  const handlePause = () => {
    setIsPaused(true)
    clearStoryTimer()
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const handleAreaClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const third = rect.width / 3

    if (x < third) {
      goToPreviousStory()
    } else if (x > third * 2) {
      goToNextStory()
    }
  }

  if (loading) {
    return (
      <div className="story-viewer-overlay">
        <div className="story-viewer-loading">Chargement...</div>
      </div>
    )
  }

  if (error || userStories.length === 0) {
    return (
      <div className="story-viewer-overlay" onClick={onClose}>
        <div className="story-viewer-error">
          {error || 'Aucune story disponible'}
        </div>
      </div>
    )
  }

  const currentStory = userStories[currentIndex]

  // Protection contre l'écran blanc
  if (!currentStory) {
    return null
  }

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-container">
        {/* Progress bars */}
        <div className="story-progress-bars">
          {userStories.map((_, index) => (
            <div key={index} className="story-progress-bar-wrapper">
              <div
                className="story-progress-bar"
                style={{
                  width: index === currentIndex
                    ? `${progress}%`
                    : index < currentIndex
                    ? '100%'
                    : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <img
              src={currentStory.user.avatar_url}
              alt={currentStory.user.username}
              className="story-viewer-avatar"
            />
            <span className="story-viewer-username">@{currentStory.user.username}</span>
            <span className="story-viewer-time">
              Il y a {getTimeAgo(currentStory.created_at)}
            </span>
          </div>
          <button className="story-viewer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Story content */}
        <div
          className="story-viewer-content"
          onClick={handleAreaClick}
          onMouseDown={handlePause}
          onMouseUp={handleResume}
          onTouchStart={handlePause}
          onTouchEnd={handleResume}
        >
          {currentStory.type === 'image' && (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="story-viewer-media"
              onError={(e) => {
                console.error('Erreur chargement image story:', currentStory.media_url)
                e.target.style.backgroundColor = '#667eea'
                e.target.alt = 'Erreur de chargement'
              }}
              onLoad={() => {
                console.log('Image charg\u00e9e avec succ\u00e8s:', currentStory.media_url)
              }}
            />
          )}

          {currentStory.type === 'text' && (
            <div
              className="story-viewer-text"
              style={{ backgroundColor: currentStory.background_color || '#667eea' }}
            >
              <p>{currentStory.content}</p>
            </div>
          )}

          {/* Navigation areas (invisible) */}
          <div className="story-nav-area story-nav-left" />
          <div className="story-nav-area story-nav-right" />
        </div>

        {/* Footer with views */}
        {currentStory.user.id === user?.id && (
          <div className="story-viewer-footer">
            <div className="story-viewer-views">
              <span className="views-icon">👁️</span>
              <span className="views-count">
                {currentStory.views_count || 0}
              </span>
              <span className="views-label">
                {currentStory.views_count === 0
                  ? 'Aucune vue'
                  : currentStory.views_count === 1
                  ? 'vue'
                  : 'vues'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format time ago
const getTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  return `${Math.floor(diffInSeconds / 86400)}j`
}

export default StoryViewer
