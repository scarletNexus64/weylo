import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import '../styles/Stories.css'

export default function Stories() {
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [showAddStory, setShowAddStory] = useState(false)

  // Stories data - exemple
  const stories = [
    {
      id: 1,
      user_name: 'Aminata K.',
      user_avatar: 'A',
      has_story: true,
      is_viewed: false,
      story_count: 3,
      time_ago: 'Il y a 2h',
      stories: [
        { id: 1, type: 'image', content: '🌟', text: 'Excellente journée !', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
        { id: 2, type: 'image', content: '🎉', text: 'Nouveau projet lancé', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
        { id: 3, type: 'image', content: '✨', text: 'Merci pour tout', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' }
      ]
    },
    {
      id: 2,
      user_name: 'Ibrahim M.',
      user_avatar: 'I',
      has_story: true,
      is_viewed: true,
      story_count: 2,
      time_ago: 'Il y a 5h',
      stories: [
        { id: 1, type: 'image', content: '⚽', text: 'Match incroyable !', bg: 'linear-gradient(135deg, #fa709a, #fee140)' },
        { id: 2, type: 'image', content: '🏆', text: 'Victoire !', bg: 'linear-gradient(135deg, #30cfd0, #330867)' }
      ]
    },
    {
      id: 3,
      user_name: 'Fatou D.',
      user_avatar: 'F',
      has_story: true,
      is_viewed: false,
      story_count: 1,
      time_ago: 'Il y a 1h',
      stories: [
        { id: 1, type: 'image', content: '💖', text: 'Belle soirée', bg: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
      ]
    },
    {
      id: 4,
      user_name: 'Moussa S.',
      user_avatar: 'M',
      has_story: true,
      is_viewed: true,
      story_count: 1,
      time_ago: 'Il y a 8h',
      stories: [
        { id: 1, type: 'image', content: '🎵', text: 'Nouveau son', bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)' }
      ]
    },
    {
      id: 5,
      user_name: 'Aïcha T.',
      user_avatar: 'A',
      has_story: true,
      is_viewed: false,
      story_count: 2,
      time_ago: 'Il y a 3h',
      stories: [
        { id: 1, type: 'image', content: '📚', text: 'Session révision', bg: 'linear-gradient(135deg, #fdcbf1, #e6dee9)' },
        { id: 2, type: 'image', content: '☕', text: 'Pause café', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' }
      ]
    }
  ]

  const myStory = {
    id: 0,
    user_name: 'Toi',
    user_avatar: '+',
    has_story: false
  }

  const openStory = (index) => {
    setCurrentStoryIndex(index)
    setShowStoryViewer(true)
  }

  const closeStoryViewer = () => {
    setShowStoryViewer(false)
  }

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else {
      closeStoryViewer()
    }
  }

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    }
  }

  const handleAddStory = () => {
    setShowAddStory(true)
  }

  const currentStoryData = stories[currentStoryIndex]
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const nextSlide = () => {
    if (currentStoryData && currentSlideIndex < currentStoryData.stories.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    } else {
      setCurrentSlideIndex(0)
      nextStory()
    }
  }

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    } else if (currentStoryIndex > 0) {
      prevStory()
      const prevStoryData = stories[currentStoryIndex - 1]
      setCurrentSlideIndex(prevStoryData.stories.length - 1)
    }
  }

  return (
    <div className="stories-container">
      <div className="stories-header">
        <h2>Stories 24h ⏰</h2>
        <span className="stories-count">{stories.filter(s => !s.is_viewed).length} nouvelles</span>
      </div>

      <div className="stories-list">
        {/* My Story */}
        <div className="story-item my-story" onClick={handleAddStory}>
          <div className="story-avatar-wrapper">
            <div className="story-avatar add-story">
              <Plus size={24} strokeWidth={3} />
            </div>
          </div>
          <span className="story-name">Ajouter</span>
        </div>

        {/* Other Stories */}
        {stories.map((story, index) => (
          <div
            key={story.id}
            className={`story-item ${story.is_viewed ? 'viewed' : ''}`}
            onClick={() => openStory(index)}
          >
            <div className="story-avatar-wrapper">
              <div className={`story-ring ${story.is_viewed ? 'viewed' : ''}`}>
                <div className="story-avatar">{story.user_avatar}</div>
              </div>
              <span className="story-count-badge">{story.story_count}</span>
            </div>
            <span className="story-name">{story.user_name}</span>
          </div>
        ))}
      </div>

      {/* Story Viewer */}
      {showStoryViewer && currentStoryData && (
        <div className="story-viewer">
          <div className="story-viewer-overlay" onClick={closeStoryViewer}></div>
          <div className="story-viewer-content">
            {/* Story Progress Bars */}
            <div className="story-progress-bars">
              {currentStoryData.stories.map((_, idx) => (
                <div key={idx} className="progress-bar-wrapper">
                  <div
                    className={`progress-bar ${idx < currentSlideIndex ? 'complete' : idx === currentSlideIndex ? 'active' : ''}`}
                  ></div>
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="story-viewer-header">
              <div className="story-user-info">
                <div className="story-user-avatar">{currentStoryData.user_avatar}</div>
                <div className="story-user-details">
                  <span className="story-user-name">{currentStoryData.user_name}</span>
                  <span className="story-time">{currentStoryData.time_ago}</span>
                </div>
              </div>
              <button className="btn-close-story" onClick={closeStoryViewer}>
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Story Content */}
            <div
              className="story-content"
              style={{ background: currentStoryData.stories[currentSlideIndex]?.bg }}
            >
              <div className="story-emoji">{currentStoryData.stories[currentSlideIndex]?.content}</div>
              <div className="story-text">{currentStoryData.stories[currentSlideIndex]?.text}</div>
            </div>

            {/* Story Navigation */}
            <div className="story-navigation">
              <div className="story-nav-left" onClick={prevSlide}></div>
              <div className="story-nav-right" onClick={nextSlide}></div>
            </div>

            {/* Story Controls */}
            <div className="story-controls">
              <input type="text" placeholder="Répondre..." className="story-reply-input" />
              <button className="btn-story-like">❤️</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddStory && (
        <div className="modal-overlay" onClick={() => setShowAddStory(false)}>
          <div className="modal-content add-story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📸 Ajouter une Story</h3>
              <button className="btn-close" onClick={() => setShowAddStory(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="add-story-options">
                <button className="add-story-option">
                  <div className="option-icon">📷</div>
                  <span>Prendre une photo</span>
                </button>
                <button className="add-story-option">
                  <div className="option-icon">🖼️</div>
                  <span>Choisir une image</span>
                </button>
                <button className="add-story-option">
                  <div className="option-icon">✏️</div>
                  <span>Créer un texte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
