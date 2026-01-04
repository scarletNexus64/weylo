import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDialog } from '../../contexts/DialogContext'
import storiesService from '../../services/storiesService'
import premiumService from '../../services/premiumService'
import PremiumBadge from '../shared/PremiumBadge'
import './StoryViewer.css'

const StoryViewer = ({ userId, username, allStories = [], currentUserIndex = 0, onClose, onNextUser }) => {
  const { user } = useAuth()
  const { error: showError } = useDialog()
  const [userStories, setUserStories] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showRevealModal, setShowRevealModal] = useState(false)
  const [revealLoading, setRevealLoading] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState([])
  const [viewersLoading, setViewersLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0, time: 0 })
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipingVertical, setIsSwipingVertical] = useState(false)
  const timerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    loadUserStories()
    setCurrentIndex(0)
    setProgress(0)
  }, [userId])

  // Prevent body scroll when viewer is open
  useEffect(() => {
    // Sauvegarder la position de scroll actuelle
    const scrollY = window.scrollY

    // Ajouter classe pour cacher les menus Dashboard
    document.body.classList.add('story-viewer-open')

    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.height = '100%'

    // Aussi bloquer le html pour Safari iOS
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.position = 'fixed'
    document.documentElement.style.width = '100%'
    document.documentElement.style.height = '100%'

    return () => {
      // Retirer la classe
      document.body.classList.remove('story-viewer-open')

      // Restaurer les styles
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.height = ''

      document.documentElement.style.overflow = ''
      document.documentElement.style.position = ''
      document.documentElement.style.width = ''
      document.documentElement.style.height = ''

      // Restaurer la position de scroll
      window.scrollTo(0, scrollY)
    }
  }, [])

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
      const data = userId
        ? await storiesService.getUserStoriesById(userId)
        : await storiesService.getUserStories(username)
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
    const interval = 50
    const increment = (100 / (duration * 1000)) * interval

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          clearStoryTimer()
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
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      const nextUserIndex = currentUserIndex + 1
      if (onNextUser && nextUserIndex < allStories.length) {
        onNextUser(nextUserIndex)
      } else {
        onClose()
      }
    }
  }

  const goToPreviousStory = () => {
    clearStoryTimer()
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    } else {
      const prevUserIndex = currentUserIndex - 1
      if (onNextUser && prevUserIndex >= 0) {
        onNextUser(prevUserIndex)
      }
    }
  }

  const handlePause = () => {
    setIsPaused(true)
    clearStoryTimer()
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const loadViewers = async () => {
    const story = userStories[currentIndex]
    if (!story) return

    setViewersLoading(true)
    try {
      const data = await storiesService.getViewers(story.id)
      setViewers(data.viewers || [])
      setShowViewers(true)
    } catch (err) {
      console.error('Erreur lors du chargement des viewers:', err)
      showError(err.response?.data?.message || 'Erreur lors du chargement des viewers')
    } finally {
      setViewersLoading(false)
    }
  }

  const handleRevealIdentity = async () => {
    const story = userStories[currentIndex]
    if (!story) return

    setRevealLoading(true)
    try {
      const result = await premiumService.subscribeToStory(story.id)

      if (result.payment && result.payment.payment_url) {
        window.location.href = result.payment.payment_url
      } else {
        await loadUserStories()
        setShowRevealModal(false)
      }
    } catch (err) {
      console.error('Erreur lors de l\'abonnement:', err)
      showError(err.response?.data?.message || 'Erreur lors du paiement')
    } finally {
      setRevealLoading(false)
    }
  }

  const handleDeleteStory = async () => {
    const story = userStories[currentIndex]
    if (!story) return

    setDeleteLoading(true)
    try {
      await storiesService.deleteStory(story.id)

      const updatedStories = userStories.filter((_, index) => index !== currentIndex)
      setUserStories(updatedStories)
      setShowDeleteConfirm(false)

      if (updatedStories.length === 0) {
        const nextUserIndex = currentUserIndex + 1
        if (onNextUser && nextUserIndex < allStories.length) {
          onNextUser(nextUserIndex)
        } else {
          onClose()
        }
      } else {
        if (currentIndex >= updatedStories.length) {
          setCurrentIndex(updatedStories.length - 1)
        }
        setProgress(0)
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      showError(err.response?.data?.message || 'Erreur lors de la suppression de la story')
    } finally {
      setDeleteLoading(false)
    }
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

  const handleTouchStart = (e) => {
    const now = Date.now()
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: now
    })
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: now
    })
    setIsSwipingVertical(false)
    handlePause()
  }

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY

    setTouchEnd({
      x: currentX,
      y: currentY,
      time: Date.now()
    })

    const deltaY = currentY - touchStart.y
    const deltaX = Math.abs(currentX - touchStart.x)
    const absDeltaY = Math.abs(deltaY)

    if (!isSwipingVertical && (absDeltaY > 10 || deltaX > 10)) {
      if (absDeltaY > deltaX * 0.7) {
        setIsSwipingVertical(true)
      }
    }

    if (isSwipingVertical || absDeltaY > deltaX) {
      e.preventDefault()

      let offset = deltaY
      const maxOffset = 300
      if (absDeltaY > maxOffset) {
        const excess = absDeltaY - maxOffset
        offset = deltaY > 0
          ? maxOffset + excess * 0.3
          : -(maxOffset + excess * 0.3)
      }

      setSwipeOffset(offset)
    }
  }

  const handleTouchEnd = () => {
    const deltaX = Math.abs(touchEnd.x - touchStart.x)
    const deltaY = touchEnd.y - touchStart.y
    const absDeltaY = Math.abs(deltaY)
    const timeDelta = touchEnd.time - touchStart.time

    const velocity = timeDelta > 0 ? absDeltaY / timeDelta : 0

    const minSwipeDistance = 80
    const minVelocity = 0.5
    const quickSwipeDistance = 40

    setIsSwipingVertical(false)

    const isVerticalSwipe = absDeltaY > deltaX
    const isStrongSwipe = absDeltaY > minSwipeDistance
    const isQuickSwipe = velocity > minVelocity && absDeltaY > quickSwipeDistance

    if (isVerticalSwipe && (isStrongSwipe || isQuickSwipe)) {
      setSwipeOffset(deltaY > 0 ? 1000 : -1000)
      setTimeout(() => {
        onClose()
      }, 200)
      return
    }

    setSwipeOffset(0)

    if (!isVerticalSwipe && deltaX > minSwipeDistance) {
      const rect = document.querySelector('.story-card-content')?.getBoundingClientRect()
      if (rect) {
        const startX = touchStart.x - rect.left
        const third = rect.width / 3

        if (startX < third) {
          goToPreviousStory()
        } else if (startX > third * 2) {
          goToNextStory()
        }
      }
    } else if (deltaX < 10 && absDeltaY < 10) {
      handleResume()
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

  if (!currentStory) {
    return null
  }

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      {/* Close button outside card */}
      <button className="story-viewer-close-btn" onClick={onClose}>
        ✕
      </button>

      <div
        className="story-viewer-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${swipeOffset}px) scale(${swipeOffset !== 0 ? Math.max(0.85, 1 - Math.abs(swipeOffset) / 1000) : 1})`,
          opacity: swipeOffset !== 0 ? Math.max(0.5, 1 - Math.abs(swipeOffset) / 400) : 1,
          transition: Math.abs(swipeOffset) > 500 ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out' : 'none'
        }}
      >
        {/* Progress bars - INSIDE card at top */}
        <div className="story-card-progress-bars">
          {userStories.map((_, index) => (
            <div key={index} className="story-card-progress-bar-wrapper">
              <div
                className="story-card-progress-bar"
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

        {/* Header - INSIDE card under progress */}
        <div className="story-card-header">
          <img
            src={currentStory.user.avatar_url}
            alt={currentStory.user.username}
            className="story-card-avatar"
          />
          <div className="story-card-user-info">
            <span className="story-card-username">
              {user?.is_premium || !currentStory.is_anonymous ? (
                <>
                  @{currentStory.user.username}
                  {currentStory.user.is_premium && <PremiumBadge size="small" />}
                </>
              ) : (
                <>
                  Anonyme
                  <span className="story-anonymous-badge">🔒</span>
                </>
              )}
            </span>
            <span className="story-card-time">
              Il y a {getTimeAgo(currentStory.created_at)}
            </span>
          </div>
        </div>

        {/* Story content - Main area */}
        <div
          className="story-card-content"
          onClick={handleAreaClick}
          onMouseDown={handlePause}
          onMouseUp={handleResume}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentStory.type === 'image' && (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="story-card-media"
              onError={(e) => {
                console.error('Erreur chargement image story:', currentStory.media_url)
                e.target.style.backgroundColor = '#667eea'
                e.target.alt = 'Erreur de chargement'
              }}
              onLoad={() => {
                console.log('Image chargée avec succès:', currentStory.media_url)
              }}
            />
          )}

          {currentStory.type === 'text' && (
            <div
              className="story-card-text"
              style={{ backgroundColor: currentStory.background_color || '#667eea' }}
            >
              <p>{currentStory.content}</p>
            </div>
          )}

          {/* Navigation areas (invisible) */}
          <div className="story-nav-area story-nav-left" />
          <div className="story-nav-area story-nav-right" />
        </div>

        {/* Footer - INSIDE card at bottom - ALWAYS VISIBLE */}
        {currentStory.user.id === user?.id && (
          <div className="story-card-footer">
            <div
              className="story-card-views"
              onClick={(e) => {
                e.stopPropagation()
                if (currentStory.viewers_count > 0 && !showViewers) {
                  loadViewers()
                }
              }}
            >
              <span className="views-icon">👁️</span>
              <span className="views-text">
                {currentStory.viewers_count || 0} {currentStory.viewers_count === 1 ? 'vue' : 'vues'}
              </span>
            </div>
            <button
              className="story-card-delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
                handlePause()
              }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Modal de révélation d'identité */}
      {showRevealModal && (
        <div className="story-reveal-modal" onClick={() => setShowRevealModal(false)}>
          <div className="story-reveal-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Révéler l'identité</h3>
            <p>
              {currentStory.user.id === user?.id
                ? "Payez 450 FCFA pour voir qui a vu votre story"
                : "Payez 450 FCFA pour révéler l'identité de l'auteur de cette story"}
            </p>
            <div className="story-reveal-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowRevealModal(false)}
                disabled={revealLoading}
              >
                Annuler
              </button>
              <button
                className="btn-pay"
                onClick={handleRevealIdentity}
                disabled={revealLoading}
              >
                {revealLoading ? 'Chargement...' : 'Payer 450 FCFA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des viewers */}
      {showViewers && (
        <div className="story-viewers-modal" onClick={() => setShowViewers(false)}>
          <div className="story-viewers-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewers-header">
              <h3>Vues</h3>
              <button
                className="story-viewers-close"
                onClick={() => setShowViewers(false)}
              >
                ✕
              </button>
            </div>

            {viewersLoading ? (
              <div className="story-viewers-loading">Chargement...</div>
            ) : (
              <>
                <div className="story-viewers-count">
                  {viewers.length} {viewers.length === 1 ? 'vue' : 'vues'}
                </div>

                <div className="story-viewers-list">
                  {viewers.length === 0 ? (
                    <div className="story-viewers-empty">Aucune vue pour le moment</div>
                  ) : (
                    viewers.map((viewer, index) => {
                      const canSeeViewerIdentity = user?.is_premium || viewer.user?.username
                      const viewerName = canSeeViewerIdentity && viewer.user
                        ? `${viewer.user.first_name || ''} ${viewer.user.last_name || ''}`.trim() || viewer.user.username || 'Anonyme'
                        : 'Anonyme'
                      const viewerAvatar = viewer.user?.initial || 'A'

                      return (
                        <div key={index} className="story-viewer-item">
                          <div className="story-viewer-item-left">
                            <div className="story-viewer-item-avatar">
                              {viewerAvatar}
                            </div>
                            <span className="story-viewer-item-username">
                              {viewerName}
                              {canSeeViewerIdentity && viewer.user?.is_premium && <PremiumBadge size="small" />}
                            </span>
                          </div>
                          <span className="story-viewer-item-time">
                            {getTimeAgo(viewer.viewed_at)}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="story-delete-modal" onClick={() => { setShowDeleteConfirm(false); handleResume(); }}>
          <div className="story-delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer la story ?</h3>
            <p>Cette action est irréversible. Voulez-vous vraiment supprimer cette story ?</p>
            <div className="story-delete-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  handleResume()
                }}
                disabled={deleteLoading}
              >
                Annuler
              </button>
              <button
                className="btn-delete"
                onClick={handleDeleteStory}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
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
