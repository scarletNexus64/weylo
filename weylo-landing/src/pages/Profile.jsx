import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Profile.css'

export default function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || 'John',
    last_name: user?.last_name || 'Doe',
    username: user?.username || 'john_doe',
    bio: user?.bio || 'Salut ! Je suis nouveau sur Weylo 👋',
    phone: user?.phone || '+221 77 123 45 67',
    email: user?.email || 'john@weylo.temp'
  })
  const [privacySettings, setPrivacySettings] = useState({
    show_profile_to_public: true,
    allow_anonymous_messages: true,
    allow_confessions: true,
    show_online_status: true
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePrivacyChange = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting]
    })
  }

  const handleSaveProfile = () => {
    // In real app, save to backend
    alert('Profil mis à jour avec succès !')
    setIsEditing(false)
  }

  const profileUrl = `https://weylo.app/u/${formData.username}`

  const accountStats = [
    { label: 'Messages reçus', value: 245, icon: '💌' },
    { label: 'Confessions', value: 89, icon: '📢' },
    { label: 'Cadeaux reçus', value: 42, icon: '🎁' },
    { label: 'Streak maximum', value: 67, icon: '🔥' }
  ]

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-info-section">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">{formData.first_name[0]}</div>
            <button className="btn-change-avatar">📷</button>
          </div>
          <div className="profile-main-info">
            <div className="profile-name-section">
              <h1>{formData.first_name} {formData.last_name}</h1>
              {user?.is_premium && <span className="premium-badge">👑 Premium</span>}
            </div>
            <p className="profile-username">@{formData.username}</p>
            <p className="profile-bio">{formData.bio}</p>
          </div>
          <button className="btn-edit-profile" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '✕ Annuler' : '✏️ Modifier le profil'}
          </button>
        </div>
      </div>

      <div className="profile-content">
        {/* Edit Profile Form */}
        {isEditing && (
          <div className="edit-profile-section">
            <h3>Modifier les informations</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  maxLength={200}
                />
                <span className="char-count">{formData.bio.length}/200</span>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-save" onClick={handleSaveProfile}>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        )}

        {/* Profile Link */}
        <div className="profile-link-section">
          <h3>Ton lien Weylo</h3>
          <p>Partage ce lien pour recevoir des messages anonymes</p>
          <div className="link-box">
            <input type="text" value={profileUrl} readOnly />
            <button onClick={() => {
              navigator.clipboard.writeText(profileUrl)
              alert('Lien copié !')
            }}>
              📋 Copier
            </button>
          </div>
        </div>

        {/* Account Stats */}
        <div className="account-stats-section">
          <h3>Statistiques du compte</h3>
          <div className="stats-grid">
            {accountStats.map((stat, index) => (
              <div key={index} className="stat-box">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="privacy-section">
          <h3>Paramètres de confidentialité</h3>
          <div className="privacy-settings">
            <div className="privacy-item">
              <div className="privacy-info">
                <div className="privacy-title">🌐 Profil public</div>
                <div className="privacy-description">Permet à tout le monde de voir ton profil</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.show_profile_to_public}
                  onChange={() => handlePrivacyChange('show_profile_to_public')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <div className="privacy-title">💌 Messages anonymes</div>
                <div className="privacy-description">Autorise les messages anonymes</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.allow_anonymous_messages}
                  onChange={() => handlePrivacyChange('allow_anonymous_messages')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <div className="privacy-title">📢 Confessions publiques</div>
                <div className="privacy-description">Autorise les confessions sur ton profil</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.allow_confessions}
                  onChange={() => handlePrivacyChange('allow_confessions')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="privacy-item">
              <div className="privacy-info">
                <div className="privacy-title">🟢 Statut en ligne</div>
                <div className="privacy-description">Affiche quand tu es en ligne</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.show_online_status}
                  onChange={() => handlePrivacyChange('show_online_status')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Premium Section */}
        {!user?.is_premium && (
          <div className="premium-section">
            <div className="premium-content">
              <div className="premium-icon">👑</div>
              <h3>Passe au Premium</h3>
              <p>Révèle l'identité des expéditeurs et accède à des fonctionnalités exclusives</p>
              <ul className="premium-features">
                <li>✓ Révélation d'identité illimitée</li>
                <li>✓ Badge Premium exclusif</li>
                <li>✓ Statistiques avancées</li>
                <li>✓ Support prioritaire</li>
              </ul>
              <button className="btn-premium">
                Devenir Premium - 450 FCFA/mois
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>Zone dangereuse</h3>
          <div className="danger-actions">
            <button className="btn-danger-secondary">
              🔒 Changer le code PIN
            </button>
            <button className="btn-danger">
              🗑️ Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
