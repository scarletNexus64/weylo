import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import storiesService from '../../services/storiesService'
import StoryViewer from './StoryViewer'
import PremiumBadge from '../shared/PremiumBadge'
import './StoriesFeed.css'

const StoriesFeed = () => {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)

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

  const handleStoryClick = (userStory) => {
    setSelectedUser(userStory)
    setViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedUser(null)
    // Recharger les stories pour mettre à jour les vues
    loadStories()
  }

  if (loading) {
    return (
      <div className="stories-feed">
        <div className="stories-loading">Chargement des stories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stories-feed">
        <div className="stories-error">{error}</div>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="stories-feed">
        <div className="stories-empty">Aucune story disponible pour le moment</div>
      </div>
    )
  }

  return (
    <>
      <div className="stories-feed">
        <div className="stories-scroll">
          {stories.map((userStory) => (
            <div
              key={userStory.user.id}
              className={`story-item ${userStory.all_viewed ? 'viewed' : 'new'}`}
              onClick={() => handleStoryClick(userStory)}
            >
              <div className="story-avatar-wrapper">
                <img
                  src={userStory.user.avatar_url}
                  alt={userStory.user.username}
                  className="story-avatar"
                />
                {!userStory.all_viewed && <div className="story-badge-new"></div>}
              </div>
              <div className="story-username">
                {user?.is_premium || !userStory.is_anonymous ? (
                  <>
                    {userStory.user.username}
                    {userStory.user.is_premium && <PremiumBadge size="small" />}
                  </>
                ) : (
                  <>
                    Anonyme
                    <span className="story-anonymous-indicator"> 🔒</span>
                  </>
                )}
              </div>
              <div className="story-count">{userStory.stories_count}</div>
            </div>
          ))}
        </div>
      </div>

      {viewerOpen && selectedUser && (
        <StoryViewer
          username={selectedUser.user.username}
          onClose={handleCloseViewer}
        />
      )}
    </>
  )
}

export default StoriesFeed
