import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/DeleteAccount.css'

const API_URL = import.meta.env.VITE_API_URL

export default function DeleteAccountPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.email || !formData.username) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/account-deletion-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({ email: '', username: '', reason: '' })
      } else {
        setError(data.message || 'Une erreur est survenue')
      }
    } catch (err) {
      console.error('Erreur lors de la demande de suppression:', err)
      setError('Impossible de traiter votre demande. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="delete-account-page">
      <div className="delete-account-container">
        <div className="delete-account-header">
          <Link to="/" className="back-link">
            ← Retour à l'accueil
          </Link>
          <div className="logo-section">
            <img src="/logo.PNG" alt="Weylo Logo" className="logo-image" />
            <h1>Weylo - Suppression de compte</h1>
          </div>
          <p className="developer-info">Développé par Weylo Team</p>
        </div>

        <div className="delete-account-content">
          {success ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Demande envoyée avec succès</h2>
              <p>
                Votre demande de suppression de compte a été enregistrée.
                Vous recevrez un email de confirmation sous 48 heures ouvrées.
              </p>
              <Link to="/" className="btn-back-home">
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <>
              <div className="info-section">
                <h2>Procédure de suppression de compte</h2>
                <p>
                  Pour demander la suppression de votre compte Weylo, veuillez suivre les étapes ci-dessous :
                </p>

                <ol className="procedure-steps">
                  <li>Remplissez le formulaire ci-dessous avec vos informations de compte</li>
                  <li>Indiquez la raison de votre départ (optionnel mais apprécié)</li>
                  <li>Soumettez votre demande</li>
                  <li>Vous recevrez un email de confirmation dans les 48 heures ouvrées</li>
                  <li>Votre compte sera définitivement supprimé sous 30 jours</li>
                </ol>

                <div className="warning-box">
                  <strong>⚠️ Attention :</strong> Cette action est irréversible. Une fois votre compte supprimé,
                  vous ne pourrez plus accéder à vos messages, conversations et autres données.
                </div>
              </div>

              <div className="data-policy-section">
                <h2>Données supprimées et conservées</h2>

                <div className="data-category">
                  <h3>Données qui seront supprimées :</h3>
                  <ul>
                    <li>Votre profil utilisateur (nom d'utilisateur, email, photo de profil)</li>
                    <li>Tous vos messages reçus et envoyés</li>
                    <li>Vos conversations privées et de groupe</li>
                    <li>Vos confessions et publications</li>
                    <li>Votre historique de transactions de cadeaux</li>
                    <li>Vos préférences et paramètres</li>
                  </ul>
                </div>

                <div className="data-category">
                  <h3>Données conservées (pour des raisons légales) :</h3>
                  <ul>
                    <li>Transactions financières (retenues pendant 7 ans conformément à la loi)</li>
                    <li>Logs de sécurité et de fraude (90 jours)</li>
                    <li>Données anonymisées à des fins statistiques</li>
                  </ul>
                </div>

                <div className="retention-info">
                  <h3>Durée de conservation avant suppression définitive :</h3>
                  <p>
                    Après validation de votre demande, vos données personnelles identifiables seront supprimées
                    sous <strong>30 jours</strong>. Pendant cette période, vous pouvez annuler votre demande en
                    contactant notre support à <a href="mailto:support@weylo.app">support@weylo.app</a>.
                  </p>
                </div>
              </div>

              <div className="form-section">
                <h2>Formulaire de demande de suppression</h2>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="delete-account-form">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre.email@exemple.com"
                      required
                    />
                    <small>L'email associé à votre compte Weylo</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">Nom d'utilisateur *</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="@votre_username"
                      required
                    />
                    <small>Votre nom d'utilisateur Weylo</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason">Raison du départ (optionnel)</label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Dites-nous pourquoi vous nous quittez (cela nous aide à améliorer Weylo)"
                      rows="4"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-submit-deletion"
                    disabled={loading}
                  >
                    {loading ? 'Envoi en cours...' : 'Demander la suppression de mon compte'}
                  </button>
                </form>
              </div>

              <div className="support-section">
                <h3>Besoin d'aide ?</h3>
                <p>
                  Si vous avez des questions ou souhaitez discuter avant de supprimer votre compte,
                  contactez notre équipe support :
                </p>
                <ul>
                  <li>Email : <a href="mailto:support@weylo.app">support@weylo.app</a></li>
                  <li>Depuis l'application : Menu → Aide & Support</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="delete-account-footer">
          <p>&copy; 2025 Weylo. Tous droits réservés.</p>
          <div className="footer-links">
            <Link to="/legal/privacy-policy">Politique de confidentialité</Link>
            <Link to="/legal/terms-of-service">Conditions d'utilisation</Link>
            <Link to="/">Accueil</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
