import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import confessionsService from '../services/confessionsService'
import '../styles/ConfessionDetail.css'

export default function ConfessionDetail() {
  const { id } = useParams()
  const [confession, setConfession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadConfession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadConfession = async () => {
    try {
      setLoading(true)
      const data = await confessionsService.getConfessionById(id)
      setConfession(data.confession)
      setError(null)
    } catch (err) {
      console.error('❌ Erreur lors du chargement de la confession:', err)
      setError('Impossible de charger cette confession')
    } finally {
      setLoading(false)
    }
  }

  // Meta tags dynamiques
  const getMetaTags = () => {
    if (!confession) {
      return {
        title: 'Confession | Weylo',
        description: 'Découvre des confessions anonymes sur Weylo',
        image: `${window.location.origin}/logo.PNG`
      }
    }

    const contentPreview = confession.content.length > 160
      ? `${confession.content.substring(0, 160)}...`
      : confession.content

    return {
      title: `Confession anonyme | Weylo`,
      description: contentPreview,
      image: confession.media_url || `${window.location.origin}/logo.PNG`,
      url: window.location.href
    }
  }

  const meta = getMetaTags()

  // App Store et Play Store URLs
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.weylo.app&pcampaignid=web_share'
  const APP_STORE_URL = 'https://apps.apple.com/app/weylo/id123456789' // À remplacer avec votre vraie URL App Store

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Chargement... | Weylo</title>
        </Helmet>
        <div className="confession-detail-landing">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !confession) {
    return (
      <>
        <Helmet>
          <title>Confession introuvable | Weylo</title>
          <meta name="description" content="Cette confession n'existe pas ou a été supprimée." />
        </Helmet>
        <div className="confession-detail-landing">
          <div className="error-container">
            <div className="error-icon">😕</div>
            <h1>Confession introuvable</h1>
            <p>Cette confession n'existe pas ou a été supprimée.</p>
            <a href="/" className="btn-primary">Retour à l'accueil</a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={meta.url} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:site_name" content="Weylo" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={meta.url} />
        <meta property="twitter:title" content={meta.title} />
        <meta property="twitter:description" content={meta.description} />
        <meta property="twitter:image" content={meta.image} />
      </Helmet>

      <div className="confession-detail-landing">
        <div className="landing-container">
          {/* Logo */}
          <div className="landing-logo">
            <img src="/logo.PNG" alt="Weylo" />
            <h1>Weylo</h1>
          </div>

          {/* Confession Preview */}
          <div className="confession-preview">
            <div className="confession-icon">💬</div>
            <h2>Confession anonyme</h2>
            <div className="confession-preview-content">
              <p>"{confession.content.substring(0, 150)}{confession.content.length > 150 ? '...' : ''}"</p>
            </div>
            {confession.media_url && confession.media_type === 'image' && (
              <div className="confession-preview-image">
                <img src={confession.media_url} alt="Confession media" />
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h3>Découvre cette confession et bien plus encore sur l'application Weylo</h3>
            <p>Rejoins des milliers d'utilisateurs qui partagent et découvrent des confessions anonymes</p>

            <div className="app-buttons">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-button google-play"
              >
                <div className="app-button-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                </div>
                <div className="app-button-text">
                  <span className="app-button-label">Télécharger sur</span>
                  <span className="app-button-store">Google Play</span>
                </div>
              </a>

              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-button app-store"
              >
                <div className="app-button-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                </div>
                <div className="app-button-text">
                  <span className="app-button-label">Télécharger sur</span>
                  <span className="app-button-store">App Store</span>
                </div>
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="landing-features">
            <div className="feature-item">
              <span className="feature-icon">🎭</span>
              <h4>100% Anonyme</h4>
              <p>Partage et lis des confessions en toute confidentialité</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <h4>Communauté active</h4>
              <p>Des milliers d'utilisateurs partagent chaque jour</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <h4>Sécurisé</h4>
              <p>Tes données sont protégées et chiffrées</p>
            </div>
          </div>

          {/* Footer */}
          <div className="landing-footer">
            <p>© 2025 Weylo. Tous droits réservés.</p>
            <div className="landing-footer-links">
              <a href="/">Accueil</a>
              <a href="/legal/privacy-policy">Confidentialité</a>
              <a href="/legal/terms-of-service">Conditions</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
