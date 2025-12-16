import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import storiesService from '../../services/storiesService'
import './CreateStory.css'

const CreateStory = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const [storyType, setStoryType] = useState('image') // image, text
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#667eea')
  const [duration, setDuration] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifier la taille (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 50MB)')
      return
    }

    // Vérifier le type
    if (storyType === 'image' && !file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('type', storyType)
      formData.append('duration', duration)

      if (storyType === 'text') {
        if (!textContent.trim()) {
          setError('Veuillez entrer un texte')
          setLoading(false)
          return
        }
        formData.append('content', textContent)
        formData.append('background_color', backgroundColor)
      } else {
        if (!mediaFile) {
          setError('Veuillez sélectionner un fichier')
          setLoading(false)
          return
        }
        formData.append('media', mediaFile)
      }

      const response = await storiesService.createStory(formData)
      console.log('✅ Story créée avec succès:', response)
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('❌ Erreur création story:', err)
      console.error('Détails erreur:', err.response?.data)
      setError(err.response?.data?.message || 'Erreur lors de la création de la story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-story-overlay" onClick={onClose}>
      <div className="create-story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-story-header">
          <h2>Créer une story</h2>
          <button className="create-story-close" onClick={onClose}>✕</button>
        </div>

        <div className="create-story-content">
          {/* Type selector */}
          <div className="story-type-selector">
            <button
              className={`type-btn ${storyType === 'image' ? 'active' : ''}`}
              onClick={() => {
                setStoryType('image')
                setMediaFile(null)
                setMediaPreview(null)
              }}
            >
              📷 Image
            </button>
            <button
              className={`type-btn ${storyType === 'text' ? 'active' : ''}`}
              onClick={() => {
                setStoryType('text')
                setMediaFile(null)
                setMediaPreview(null)
              }}
            >
              ✏️ Texte
            </button>
          </div>

          {/* Content area */}
          <div className="story-content-area">
            {storyType === 'text' ? (
              <div className="story-text-editor">
                <div
                  className="story-text-preview"
                  style={{ backgroundColor }}
                >
                  <textarea
                    placeholder="Écrivez votre texte..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    maxLength={500}
                    className="story-textarea"
                  />
                  <div className="story-text-counter">
                    {textContent.length}/500
                  </div>
                </div>
                <div className="color-picker">
                  <p>Couleur de fond:</p>
                  <div className="color-options">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`color-btn ${backgroundColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setBackgroundColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="story-media-uploader">
                {!mediaPreview ? (
                  <div className="media-upload-area" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon">
                      📷
                    </div>
                    <p>Cliquez pour sélectionner une image</p>
                    <span className="upload-hint">Max 50MB</span>
                  </div>
                ) : (
                  <div className="media-preview">
                    <img src={mediaPreview} alt="Preview" />
                    <button
                      className="change-media-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Changer
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Duration selector */}
          <div className="story-duration">
            <label>Durée d'affichage: {duration}s</label>
            <input
              type="range"
              min="3"
              max="30"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="duration-slider"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="story-error-message">
              {error}
            </div>
          )}
        </div>

        <div className="create-story-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button
            className="btn-publish"
            onClick={handleSubmit}
            disabled={loading || (storyType === 'text' && !textContent.trim()) || (storyType !== 'text' && !mediaFile)}
          >
            {loading ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateStory
