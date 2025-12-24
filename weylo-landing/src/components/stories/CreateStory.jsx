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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [compressing, setCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState(null)
  const fileInputRef = useRef(null)

  const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
  const MAX_IMAGE_WIDTH = 1920
  const MAX_IMAGE_HEIGHT = 1920
  const COMPRESSION_QUALITY = 0.8

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ]

  /**
   * Formater la taille du fichier pour affichage
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Compresser une image avec fallback pour PWA
   */
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      // Vérifier si Canvas est disponible (peut être limité dans certains contextes PWA)
      try {
        const testCanvas = document.createElement('canvas')
        const testCtx = testCanvas.getContext('2d')
        if (!testCtx) {
          console.warn('Canvas non disponible, compression impossible')
          reject(new Error('Canvas non supporté'))
          return
        }
      } catch (err) {
        console.warn('Canvas test failed:', err)
        reject(new Error('Canvas non supporté'))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()

        // Configurer le CORS pour PWA
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            // Calculer les nouvelles dimensions en conservant le ratio
            if (width > height) {
              if (width > MAX_IMAGE_WIDTH) {
                height = Math.round((height * MAX_IMAGE_WIDTH) / width)
                width = MAX_IMAGE_WIDTH
              }
            } else {
              if (height > MAX_IMAGE_HEIGHT) {
                width = Math.round((width * MAX_IMAGE_HEIGHT) / height)
                height = MAX_IMAGE_HEIGHT
              }
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d', {
              willReadFrequently: false,
              alpha: false
            })

            // Fond blanc pour JPEG
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0, width, height)

            // Convertir en blob avec compression
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Erreur lors de la conversion'))
                }
              },
              'image/jpeg',
              COMPRESSION_QUALITY
            )
          } catch (err) {
            console.error('Erreur canvas:', err)
            reject(err)
          }
        }

        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
        img.src = e.target.result
      }

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError(null)
    setCompressionInfo(null)

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPEG, PNG, GIF, WebP)')
      return
    }

    try {
      setCompressing(true)
      const originalSize = file.size

      let finalFile = file
      let finalBlob = file
      let compressedSize = originalSize
      let compressionFailed = false

      // Essayer de compresser l'image
      try {
        const compressedBlob = await compressImage(file)
        compressedSize = compressedBlob.size
        finalBlob = compressedBlob

        // Créer un nouveau fichier à partir du blob compressé
        finalFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
      } catch (compressionErr) {
        console.warn('Compression failed, using original file:', compressionErr)
        compressionFailed = true

        // Fallback : utiliser le fichier original si < 1MB
        if (originalSize <= MAX_FILE_SIZE) {
          console.log('Original file is under 1MB, using it directly')
          finalFile = file
          finalBlob = file
          compressedSize = originalSize
        } else {
          // Si le fichier original > 1MB et la compression a échoué
          setError(`Impossible de compresser l'image. L'image originale (${formatFileSize(originalSize)}) dépasse la limite de 1 MB. Veuillez choisir une image plus petite.`)
          setCompressing(false)
          return
        }
      }

      // Vérifier si l'image (compressée ou originale) dépasse toujours 1MB
      if (compressedSize > MAX_FILE_SIZE) {
        setError(`Image trop lourde : ${formatFileSize(compressedSize)}. La taille maximale est de 1 MB. Veuillez choisir une image plus petite ou de moindre qualité.`)
        setCompressing(false)
        return
      }

      setMediaFile(finalFile)
      setMediaPreview(URL.createObjectURL(finalBlob))
      setFileSize(compressedSize)

      // Afficher les infos de compression si on a gagné de l'espace
      if (!compressionFailed && originalSize > compressedSize) {
        const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0)
        setCompressionInfo({
          original: formatFileSize(originalSize),
          compressed: formatFileSize(compressedSize),
          reduction: reduction
        })
      } else if (compressionFailed && originalSize <= MAX_FILE_SIZE) {
        // Afficher un message informatif si on utilise le fichier original
        setCompressionInfo({
          original: formatFileSize(originalSize),
          compressed: formatFileSize(originalSize),
          reduction: '0'
        })
      }

      setCompressing(false)
    } catch (err) {
      console.error('Erreur traitement fichier:', err)
      setError('Erreur lors du traitement de l\'image. Veuillez réessayer.')
      setCompressing(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setUploadProgress(0)
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

      // Simuler une progression pour l'upload (axios ne supporte pas toujours onUploadProgress en PWA)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await storiesService.createStory(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('✅ Story créée avec succès:', response)

      // Petit délai pour voir le 100%
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 500)
    } catch (err) {
      console.error('❌ Erreur création story:', err)
      console.error('Détails erreur:', err.response?.data)
      setError(err.response?.data?.message || 'Erreur lors de la création de la story')
      setUploadProgress(0)
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
                {compressing ? (
                  <div className="media-upload-area compressing">
                    <div className="upload-icon">
                      ⏳
                    </div>
                    <p>Compression de l'image...</p>
                    <span className="upload-hint">Veuillez patienter</span>
                  </div>
                ) : !mediaPreview ? (
                  <div className="media-upload-area" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon">
                      📷
                    </div>
                    <p>Cliquez pour sélectionner une image</p>
                    <span className="upload-hint">Max 1 MB - Compression automatique</span>
                  </div>
                ) : (
                  <div className="media-preview">
                    <img src={mediaPreview} alt="Preview" />
                    <button
                      className="change-media-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing}
                    >
                      Changer
                    </button>
                    {compressionInfo && (
                      <div className="compression-info">
                        ✓ Image optimisée : {compressionInfo.compressed}
                        <span className="compression-reduction">
                          (-{compressionInfo.reduction}%)
                        </span>
                      </div>
                    )}
                    {fileSize && !compressionInfo && (
                      <div className="file-size-info">
                        Taille : {formatFileSize(fileSize)}
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple={false}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={compressing}
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

          {/* Upload progress */}
          {loading && uploadProgress > 0 && (
            <div className="upload-progress-container">
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="upload-progress-text">
                {uploadProgress < 100 ? `Upload en cours... ${uploadProgress}%` : 'Upload terminé !'}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="story-error-message">
              {error}
            </div>
          )}
        </div>

        <div className="create-story-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading || compressing}>
            Annuler
          </button>
          <button
            className="btn-publish"
            onClick={handleSubmit}
            disabled={loading || compressing || (storyType === 'text' && !textContent.trim()) || (storyType !== 'text' && !mediaFile)}
          >
            {loading ? `Publication... ${uploadProgress}%` : compressing ? 'Compression...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateStory
