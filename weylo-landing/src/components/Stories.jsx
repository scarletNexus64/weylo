import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import storiesService from '../services/storiesService'
import StoryViewer from './stories/StoryViewer'
import CreateStory from './stories/CreateStory'
import '../styles/Stories.css'

export default function Stories() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStory, setSelectedStory] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('darkMode') === 'true'
  )

  useEffect(() => {
    loadStories()

    // Écouter les changements de thème
    const handleThemeChange = () => {
      setDarkMode(
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('darkMode') === 'true'
      )
    }

    // Observer pour détecter les changements de classe sur documentElement
    const observer = new MutationObserver(handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const loadStories = async () => {
    try {
      setLoading(true)
      const data = await storiesService.getStoriesFeed()
      setStories(data.stories || [])
      setError(null)
    } catch (err) {
      console.error('Erreur chargement stories:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement des stories')
    } finally {
      setLoading(false)
    }
  }

  const handleStoryClick = (userStory) => {
    setSelectedStory(userStory)
    setViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedStory(null)
    loadStories()
  }

  const handleCreateSuccess = () => {
    loadStories()
  }

  if (loading) {
    return (
      <div className="stories-container">
        <div className="stories-header">
          <h2 style={{ color: darkMode ? '#f9fafb' : '#1f2937' }}>Stories 24h</h2>
        </div>
        <div className="stories-loading">Chargement des stories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stories-container">
        <div className="stories-header">
          <h2 style={{ color: darkMode ? '#f9fafb' : '#1f2937' }}>Stories 24h</h2>
        </div>
        <div className="stories-empty">{error}</div>
      </div>
    )
  }

  const newStoriesCount = stories.filter(s => s.has_new).length

  // Utiliser le preview de chaque utilisateur pour l'affichage en grille
  const storyCards = stories.map(userStory => ({
    ...userStory.preview,
    userInfo: userStory.user,
    real_user_id: userStory.real_user_id,
    is_anonymous: userStory.is_anonymous,
    isViewed: userStory.all_viewed,
    has_new: userStory.has_new,
    stories_count: userStory.stories_count,
    userStory: userStory
  }))

  // Trier : stories non vues en premier
  const sortedStoryCards = [...storyCards].sort((a, b) => {
    if (!a.isViewed && b.isViewed) return -1
    if (a.isViewed && !b.isViewed) return 1
    return 0
  })

  return (
    <>
      <div className="stories-container">
        <div className="stories-header">
          <h2 style={{ color: darkMode ? '#f9fafb' : '#1f2937' }}>Stories 24h</h2>
          {newStoriesCount > 0 && (
            <span className="stories-count">{newStoriesCount} nouvelles</span>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="stories-grid">
            {/* Card pour créer la première story */}
            <div
              className="story-card add-story-card"
              onClick={() => setShowCreateStory(true)}
            >
              <div className="story-thumbnail add-story-thumbnail">
                <div className="add-story-icon">+</div>
                {/* <span className="add-story-text">Créer ma première story</span> */}
              </div>
            </div>
          </div>
        ) : (
          <div className="stories-grid">
            {/* Bouton pour créer une story */}
            <div
              className="story-card add-story-card"
              onClick={() => setShowCreateStory(true)}
            >
              <div className="story-thumbnail add-story-thumbnail">
                <div className="add-story-icon">+</div>
                <span className="add-story-text">Ajouter</span>
              </div>
            </div>

            {/* Afficher toutes les stories en grille */}
            {sortedStoryCards.map((card, index) => (
              <div
                key={`story-${card.real_user_id}-${index}`}
                className={`story-card ${card.isViewed ? 'viewed' : ''}`}
                onClick={() => handleStoryClick(card.userStory)}
              >
                <div className="story-thumbnail">
                  {card.type === 'image' && card.media_url ? (
                    <img
                      src={card.media_url}
                      alt={card.userInfo?.username}
                      className="story-thumbnail-img"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = card.userInfo?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(card.userInfo?.full_name || 'User')}&background=random`
                      }}
                    />
                  ) : card.type === 'text' ? (
                    <div
                      className="story-thumbnail-text"
                      style={{
                        background: card.background_color ||
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <span>{card.content}</span>
                    </div>
                  ) : null}

                  {/* Badge non vu */}
                  {card.has_new && (
                    <div className="story-unread-badge"></div>
                  )}

                  {/* Compteur de stories si plusieurs */}
                  {card.stories_count > 1 && (
                    <div className="story-count-badge">{card.stories_count}</div>
                  )}

                  {/* Info utilisateur en bas */}
                  <div className="story-user-info">
                    <img
                      src={card.userInfo?.avatar_url}
                      alt={card.userInfo?.username}
                      className="story-user-avatar"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.userInfo?.full_name || 'User')}&background=random`
                      }}
                    />
                    <span className="story-username">
                      {card.is_anonymous ? 'Anonyme' : card.userInfo?.username}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {viewerOpen && selectedStory && (
        <StoryViewer
          userId={selectedStory.real_user_id}
          username={selectedStory.user?.username}
          allStories={stories}
          currentUserIndex={stories.findIndex(s => s.real_user_id === selectedStory.real_user_id)}
          onClose={handleCloseViewer}
          onNextUser={(nextIndex) => {
            if (nextIndex < stories.length) {
              handleStoryClick(stories[nextIndex])
            } else {
              handleCloseViewer()
            }
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  )
}
