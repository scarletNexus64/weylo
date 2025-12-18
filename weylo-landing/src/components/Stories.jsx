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
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [showCreateStory, setShowCreateStory] = useState(false)

  useEffect(() => {
    loadStories()
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

  const handleStoryClick = (userStory, startIndex = 0) => {
    setSelectedUser({ ...userStory, startIndex })
    setViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedUser(null)
    // Recharger les stories pour mettre à jour les vues
    loadStories()
  }

  const handleCreateSuccess = () => {
    // Recharger les stories après création
    loadStories()
  }

  if (loading) {
    return (
      <div className="stories-container">
        <div className="stories-header">
          <h2>Stories 24h ⏰</h2>
        </div>
        <div className="stories-loading">Chargement des stories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stories-container">
        <div className="stories-header">
          <h2>Stories 24h ⏰</h2>
        </div>
        <div className="stories-error">{error}</div>
      </div>
    )
  }

  const newStoriesCount = stories.filter(s => s.has_new).length

  return (
    <>
      <div className="stories-container">
        <div className="stories-header">
          <h2>Stories 24h ⏰</h2>
          {newStoriesCount > 0 && (
            <span className="stories-count">{newStoriesCount} nouvelles</span>
          )}
        </div>

        <div className="stories-list">
          {/* Add Story Button */}
          <div className="story-item my-story" onClick={() => setShowCreateStory(true)}>
            <div className="story-avatar-wrapper">
              <div className="story-avatar add-story">
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>+</span>
              </div>
            </div>
            <span className="story-name">Ajouter</span>
          </div>

          {/* Stories from other users */}
          {stories.length === 0 ? (
            <div className="stories-empty">
              <p>Aucune story pour le moment</p>
            </div>
          ) : (
            stories.map((userStory) => (
              <div
                key={userStory.user.id}
                className={`story-item ${userStory.all_viewed ? 'viewed' : ''}`}
                onClick={() => handleStoryClick(userStory)}
              >
                <div className="story-avatar-wrapper">
                  <div className={`story-ring ${userStory.all_viewed ? 'viewed' : ''}`}>
                    {userStory.preview?.type === 'image' && userStory.preview?.media_url ? (
                      <img
                        src={userStory.preview.media_url}
                        alt={userStory.user.username}
                        className="story-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = userStory.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userStory.user.full_name)}&background=random`
                        }}
                      />
                    ) : userStory.preview?.type === 'text' ? (
                      <div
                        className="story-avatar-text"
                        style={{ backgroundColor: userStory.preview.background_color || '#667eea' }}
                      >
                        <span>{userStory.preview.content?.substring(0, 20)}</span>
                      </div>
                    ) : (
                      <img
                        src={userStory.user.avatar_url}
                        alt={userStory.user.username}
                        className="story-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userStory.user.full_name)}&background=random`
                        }}
                      />
                    )}
                  </div>
                  {userStory.stories_count > 0 && (
                    <span className="story-count-badge">{userStory.stories_count}</span>
                  )}
                </div>
                <span className="story-name">
                  {userStory.user.username}
                  {userStory.is_anonymous && <span className="story-anonymous-indicator"> 🔒</span>}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Story Viewer */}
      {viewerOpen && selectedUser && (
        <StoryViewer
          username={selectedUser.user.username}
          allStories={stories}
          currentUserIndex={stories.findIndex(s => s.user.id === selectedUser.user.id)}
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
