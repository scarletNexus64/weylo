import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import legalPagesService from '../services/legalPagesService'
import '../styles/LegalPage.css'

export default function LegalPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPage()
  }, [slug])

  const loadPage = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await legalPagesService.getPageBySlug(slug)

      if (response.success) {
        setPage(response.page)
      } else {
        setError(response.message || 'Page non trouvée')
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la page légale:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement de la page')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="legal-page">
        <div className="legal-page-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="legal-page">
        <div className="legal-page-container">
          <div className="error-state">
            <h1>😔 Oups !</h1>
            <p>{error}</p>
            <Link to="/" className="btn-back-home">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="legal-page">
      <div className="legal-page-container">
        <div className="legal-page-header">
          <Link to="/" className="back-link">
            ← Retour
          </Link>
          <h1>{page?.title}</h1>
          {page?.updated_at && (
            <p className="last-updated">Dernière mise à jour : {page.updated_at}</p>
          )}
        </div>

        <div className="legal-page-content">
          <div
            className="content-html"
            dangerouslySetInnerHTML={{ __html: page?.content }}
          />
        </div>

        <div className="legal-page-footer">
          <Link to="/" className="btn-back-home">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
