import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import userService from '../services/userService'
import settingsService from '../services/settingsService'
import walletService from '../services/walletService'
import PremiumBadge from '../components/shared/PremiumBadge'
import PremiumPassModal from '../components/shared/PremiumPassModal'
import { useDialog } from '../contexts/DialogContext'
import { Wallet, ChevronRight } from 'lucide-react'
import '../styles/Profile.css'

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const { success, error: showError, warning, confirm } = useDialog()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    phone: '',
    email: ''
  })
  const [privacySettings, setPrivacySettings] = useState({
    show_profile_to_public: true,
    allow_anonymous_messages: true,
    allow_confessions: true,
    show_online_status: true
  })
  const [accountStats, setAccountStats] = useState([
    { label: 'Messages reçus', value: 0, icon: '💌' },
    { label: 'Confessions', value: 0, icon: '📢' },
    { label: 'Cadeaux reçus', value: 0, icon: '🎁' },
    { label: 'Conversations', value: 0, icon: '💬' }
  ])
  const [profileUrl, setProfileUrl] = useState('')
  const [showChangePinModal, setShowChangePinModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [pinData, setPinData] = useState({
    newPin: '',
    confirmPin: ''
  })
  const [deleteData, setDeleteData] = useState({
    password: '',
    reason: ''
  })
  const [appSettings, setAppSettings] = useState({
    reveal_anonymous_price: 500,
    premium_monthly_price: 450,
    premium_enabled: true,
    currency: 'FCFA'
  })

  // États pour le portefeuille (juste le solde pour l'aperçu)
  const [balance, setBalance] = useState(0)
  const [loadingWallet, setLoadingWallet] = useState(false)

  // Charger les données du profil au montage
  useEffect(() => {
    loadDashboardData()
    loadAppSettings()
    loadWalletData()
  }, [])

  // Charger les paramètres de l'application
  const loadAppSettings = async () => {
    try {
      const settings = await settingsService.getPublicSettings()
      console.log('📋 [PROFILE] Paramètres chargés:', settings)
      setAppSettings(settings)
    } catch (error) {
      console.error('❌ [PROFILE] Erreur lors du chargement des paramètres:', error)
      // Garder les valeurs par défaut en cas d'erreur
    }
  }

  // Charger les données du dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Vérifier si un token existe
      const token = localStorage.getItem('weylo_token')
      console.log('🔍 [PROFILE] Vérification du token:', {
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        hasUser: !!user
      })

      // Si l'utilisateur n'est pas connecté, ne pas charger
      if (!user || !token) {
        console.log('⚠️ [PROFILE] Pas d\'utilisateur ou de token, redirection...')
        setLoading(false)
        showNotification('Veuillez vous connecter pour accéder à votre profil', 'error')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
        return
      }

      console.log('📡 [PROFILE] Appel de getDashboard et getStats...')
      const [dashboardData, statsData] = await Promise.all([
        userService.getDashboard(),
        userService.getStats()
      ])
      console.log('✅ [PROFILE] Données reçues:', { dashboardData, statsData })

      // Mettre à jour les données du formulaire avec les données de l'utilisateur
      if (dashboardData.user) {
        setFormData({
          first_name: dashboardData.user.first_name || '',
          last_name: dashboardData.user.last_name || '',
          username: dashboardData.user.username || '',
          bio: dashboardData.user.bio || '',
          phone: dashboardData.user.phone || '',
          email: dashboardData.user.email || ''
        })

        // Mettre à jour les paramètres de confidentialité
        if (dashboardData.user.settings?.privacy) {
          setPrivacySettings({
            show_profile_to_public: dashboardData.user.settings.privacy.show_profile_to_public ?? true,
            allow_anonymous_messages: dashboardData.user.settings.privacy.allow_messages_from_strangers ?? true,
            allow_confessions: dashboardData.user.settings.privacy.allow_confessions ?? true,
            show_online_status: dashboardData.user.settings.privacy.show_online_status ?? true
          })
        }
      }

      // Mettre à jour les statistiques depuis la nouvelle API
      if (statsData.stats) {
        setAccountStats([
          { label: 'Messages reçus', value: statsData.stats.messages?.received || 0, icon: '💌' },
          { label: 'Confessions', value: statsData.stats.confessions?.received || 0, icon: '📢' },
          { label: 'Cadeaux reçus', value: statsData.stats.gifts?.received || 0, icon: '🎁' },
          { label: 'Conversations', value: statsData.stats.conversations?.total || 0, icon: '💬' }
        ])
      }

      // Mettre à jour le lien de partage
      if (dashboardData.share_link) {
        setProfileUrl(dashboardData.share_link)
      }
    } catch (error) {
      console.error('❌ [PROFILE] Erreur lors du chargement du dashboard:', error)
      console.error('❌ [PROFILE] Détails de l\'erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })

      // Gérer les différents types d'erreurs
      if (error.response?.status === 401) {
        showNotification('Session expirée. Veuillez vous reconnecter.', 'error')
        setTimeout(() => {
          localStorage.removeItem('weylo_token')
          localStorage.removeItem('weylo_user')
          window.location.href = '/login'
        }, 1500)
      } else if (error.response?.status === 404) {
        showNotification('Endpoint introuvable. Vérifiez la configuration de l\'API.', 'error')
        console.error('❌ [PROFILE] Endpoint 404 - Vérifier l\'URL de l\'API')
      } else if (error.response?.status === 500) {
        const errorMsg = error.response?.data?.message || 'Erreur serveur'
        showNotification(errorMsg, 'error')
        console.error('❌ [PROFILE] Erreur 500:', error.response?.data)
      } else {
        showNotification(
          error.response?.data?.message || 'Erreur lors du chargement des données',
          'error'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Charger le solde du wallet
  const loadWalletData = async () => {
    try {
      setLoadingWallet(true)
      const walletInfo = await walletService.getWalletInfo()
      setBalance(walletInfo.wallet?.balance || 0)
    } catch (err) {
      console.error('❌ [PROFILE] Erreur lors du chargement du wallet:', err)
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePrivacyChange = async (setting) => {
    const newSettings = {
      ...privacySettings,
      [setting]: !privacySettings[setting]
    }

    setPrivacySettings(newSettings)

    // Sauvegarder immédiatement les paramètres de confidentialité
    try {
      await userService.updateSettings({
        privacy: {
          show_online_status: newSettings.show_online_status,
          allow_messages_from_strangers: newSettings.allow_anonymous_messages,
          show_profile_to_public: newSettings.show_profile_to_public,
          allow_confessions: newSettings.allow_confessions
        }
      })
      showNotification('Paramètres mis à jour', 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      // Annuler le changement en cas d'erreur
      setPrivacySettings(privacySettings)
      showNotification(
        error.response?.data?.message || 'Erreur lors de la mise à jour des paramètres',
        'error'
      )
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const response = await userService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio
      })

      // Mettre à jour le contexte utilisateur
      if (response.user) {
        updateUser(response.user)
      }

      showNotification(response.message || 'Profil mis à jour avec succès !', 'success')
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error)
      showNotification(
        error.response?.data?.message || 'Erreur lors de la mise à jour du profil',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  // Fonction pour afficher les notifications
  const showNotification = (message, type = 'info') => {
    if (type === 'error') {
      showError(message)
    } else if (type === 'success') {
      success(message)
    } else if (type === 'warning') {
      warning(message)
    } else {
      success(message)
    }
  }

  // Gérer le changement d'avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('L\'image ne doit pas dépasser 2MB', 'error')
      return
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      showNotification('Le fichier doit être une image', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await userService.uploadAvatar(file)

      // Mettre à jour l'utilisateur dans le contexte
      if (response.avatar_url) {
        updateUser({ avatar: response.avatar_url })
      }

      showNotification('Avatar mis à jour avec succès', 'success')
      // Recharger les données du dashboard pour mettre à jour l'avatar
      await loadDashboardData()
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error)
      showNotification(
        error.response?.data?.message || 'Erreur lors de l\'upload de l\'avatar',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  // Gérer la copie du lien de profil
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      showNotification('Lien copié !', 'success')
    } catch (error) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = profileUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showNotification('Lien copié !', 'success')
      } catch (err) {
        showNotification('Impossible de copier le lien', 'error')
      }
      document.body.removeChild(textArea)
    }
  }

  // Gérer le changement de PIN
  const handleChangePin = async (e) => {
    e.preventDefault()

    // Validation
    if (!pinData.newPin || !pinData.confirmPin) {
      showNotification('Tous les champs sont requis', 'error')
      return
    }

    if (pinData.newPin !== pinData.confirmPin) {
      showNotification('Les codes PIN ne correspondent pas', 'error')
      return
    }

    if (pinData.newPin.length !== 4) {
      showNotification('Le code PIN doit contenir exactement 4 chiffres', 'error')
      return
    }

    if (!/^\d{4}$/.test(pinData.newPin)) {
      showNotification('Le code PIN doit contenir uniquement des chiffres', 'error')
      return
    }

    try {
      setSaving(true)
      await userService.updatePinDirect(pinData.newPin)
      showNotification('Code PIN modifié avec succès', 'success')
      setShowChangePinModal(false)
      setPinData({ newPin: '', confirmPin: '' })
    } catch (error) {
      console.error('Erreur lors du changement de PIN:', error)
      showNotification(
        error.response?.data?.message || 'Erreur lors du changement de code PIN',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  // Gérer la suppression du compte
  const handleDeleteAccount = async (e) => {
    e.preventDefault()

    if (!deleteData.password) {
      showNotification('Le mot de passe est requis', 'error')
      return
    }

    const confirmed = await confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')
    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      await userService.deleteAccount(deleteData.password, deleteData.reason)
      showNotification('Compte supprimé avec succès', 'success')
      // Déconnecter l'utilisateur
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error)
      showNotification(
        error.response?.data?.message || 'Erreur lors de la suppression du compte',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  // Gérer la déconnexion
  const handleLogout = async () => {
    const confirmed = await confirm('Voulez-vous vraiment vous déconnecter ?')
    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      await logout()
      showNotification('Déconnexion réussie', 'success')
      // Rediriger vers la page de connexion
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      showNotification('Erreur lors de la déconnexion', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className={`profile-header ${user?.is_verified ? 'verified-profile' : ''}`}>
        <div className="profile-cover"></div>
        <div className="profile-info-section">
          <div className={`profile-avatar-wrapper ${user?.is_verified ? 'verified-user' : ''}`}>
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar_url || user.avatar} alt="Avatar" />
              ) : (
                formData.first_name?.[0] || 'U'
              )}
            </div>
            {user?.is_verified && (
              <div className="avatar-verified-badge" title="Compte vérifié">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            )}
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button
              className="btn-change-avatar"
              onClick={() => document.getElementById('avatar-upload').click()}
              disabled={saving}
            >
              📷
            </button>
          </div>
          <div className="profile-main-info">
            <div className="profile-name-section">
              <h1>{formData.first_name} {formData.last_name}</h1>
              {user?.is_premium && <PremiumBadge size="large" />}
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
              <button
                className="btn-save"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
            <button onClick={handleCopyLink}>
              📋 Copier
            </button>
          </div>
        </div>

        {/* Wallet Section - Clickable Card */}
        <div
          className="profile-wallet-card"
          onClick={() => navigate('/wallet')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/wallet')
            }
          }}
        >
          <div className="wallet-card-header">
            <div className="wallet-card-icon">
              <Wallet size={20} />
            </div>
            <h3>Mon Portefeuille</h3>
            <ChevronRight className="wallet-card-arrow" size={18} />
          </div>

          <div className="wallet-card-balance">
            <span className="wallet-card-label">Solde disponible</span>
            <div className="wallet-card-amount">
              {loadingWallet ? (
                <span className="wallet-loading">Chargement...</span>
              ) : (
                <>
                  {balance.toLocaleString()} <span className="wallet-currency">FCFA</span>
                </>
              )}
            </div>
          </div>

          <div className="wallet-card-footer">
            <span>Cliquez pour gérer votre portefeuille</span>
          </div>
        </div>

        {/* Premium Section */}
        {appSettings.premium_enabled && (
          <div className="premium-section">
            <div className="premium-content">
              <div className="premium-icon">👑</div>

              {user?.is_premium ? (
                // Affichage pour les utilisateurs Premium
                <>
                  <h3>Mon Passe Premium</h3>
                  <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '15px' }}>
                    ✓ Compte Premium Actif
                  </p>

                  <div className="premium-details" style={{ marginBottom: '20px' }}>
                    {user?.premium_expires_at && (
                      <div className="premium-info-item" style={{
                        background: '#f3f4f6',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Date d'expiration</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                          {new Date(user.premium_expires_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}

                    {user?.premium_days_remaining !== undefined && user?.premium_days_remaining !== null && (
                      <div className="premium-info-item" style={{
                        background: '#fef3c7',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Jours restants</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#92400e' }}>
                          {user.premium_days_remaining} jour{user.premium_days_remaining > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}

                    {user?.premium_auto_renew && (
                      <div className="premium-info-item" style={{
                        background: '#dbeafe',
                        padding: '12px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                          🔄 Renouvellement automatique activé
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="premium-features" style={{ marginBottom: '20px' }}>
                    <li>✓ Révélation d'identité illimitée dans les chats</li>
                    <li>✓ Révélation d'identité illimitée dans les groupes</li>
                    <li>✓ Badge Premium exclusif</li>
                    <li>✓ Support prioritaire</li>
                  </ul>

                  <button className="btn-premium" onClick={() => setShowPremiumModal(true)}>
                    👑 Gérer mon Passe Premium
                  </button>
                </>
              ) : (
                // Affichage pour les utilisateurs non-Premium
                <>
                  <h3>Passe au Premium</h3>
                  <p>Révèle l'identité de tous les expéditeurs dans les chats et les groupes</p>
                  <ul className="premium-features">
                    <li>✓ Révélation d'identité illimitée dans les chats</li>
                    <li>✓ Révélation d'identité illimitée dans les groupes</li>
                    <li>✓ Badge Premium exclusif</li>
                    <li>✓ Support prioritaire</li>
                  </ul>
                  <button className="btn-premium" onClick={() => setShowPremiumModal(true)}>
                    👑 Devenir Premium - {appSettings.premium_monthly_price} {appSettings.currency}/mois
                  </button>
                  <p className="premium-note" style={{ marginTop: '10px', fontSize: '0.85rem', color: '#888' }}>
                    Prix de révélation unitaire : {appSettings.reveal_anonymous_price} {appSettings.currency}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

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

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>Zone dangereuse</h3>
          <div className="danger-actions">
            <button
              className="btn-logout"
              onClick={handleLogout}
              disabled={saving}
            >
              🚪 Se déconnecter
            </button>
            <button
              className="btn-danger-secondary"
              onClick={() => setShowChangePinModal(true)}
            >
              🔒 Changer le code PIN
            </button>
            <button
              className="btn-danger"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              🗑️ Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour changer le PIN */}
      {showChangePinModal && (
        <div className="modal-overlay" onClick={() => setShowChangePinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Changer le code PIN</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '0.9rem' }}>
              💡 Définissez un nouveau code PIN à 4 chiffres pour sécuriser votre compte
            </p>
            <form onSubmit={handleChangePin}>
              <div className="form-group">
                <label>Nouveau code PIN (4 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinData.newPin}
                  onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="Entrez 4 chiffres (ex: 1234)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmer le code PIN</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinData.confirmPin}
                  onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="Confirmez les 4 chiffres"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowChangePinModal(false)
                    setPinData({ newPin: '', confirmPin: '' })
                  }}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Modifier le PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour supprimer le compte */}
      {showDeleteAccountModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteAccountModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer le compte</h3>
            <p style={{ color: '#ff4444', marginBottom: '20px' }}>
              ⚠️ Cette action est irréversible. Toutes vos données seront supprimées définitivement.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className="form-group">
                <label>Mot de passe / Code PIN</label>
                <input
                  type="password"
                  value={deleteData.password}
                  onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                  placeholder="Entrez votre mot de passe pour confirmer"
                  required
                />
              </div>
              <div className="form-group">
                <label>Raison (optionnel)</label>
                <textarea
                  value={deleteData.reason}
                  onChange={(e) => setDeleteData({ ...deleteData, reason: e.target.value })}
                  placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowDeleteAccountModal(false)
                    setDeleteData({ password: '', reason: '' })
                  }}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-danger" disabled={saving}>
                  {saving ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Pass Modal */}
      <PremiumPassModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={async () => {
          // Recharger les données de l'utilisateur
          await loadDashboardData()
          showNotification('Passe Premium activé avec succès !', 'success')
        }}
        currentUser={user}
      />
    </div>
  )
}
