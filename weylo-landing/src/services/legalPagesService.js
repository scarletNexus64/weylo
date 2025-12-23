import apiClient from './apiClient'

/**
 * Service pour gérer les pages légales
 */
const legalPagesService = {
  /**
   * Récupérer toutes les pages légales actives (pour le footer)
   */
  async getActivePages() {
    try {
      const response = await apiClient.get('/legal-pages')
      return response.data
    } catch (error) {
      console.error('❌ [LEGAL_PAGES_SERVICE] Erreur getActivePages:', error)
      throw error
    }
  },

  /**
   * Récupérer une page légale par son slug
   */
  async getPageBySlug(slug) {
    try {
      const response = await apiClient.get(`/legal-pages/${slug}`)
      return response.data
    } catch (error) {
      console.error(`❌ [LEGAL_PAGES_SERVICE] Erreur getPageBySlug(${slug}):`, error)
      throw error
    }
  }
}

export default legalPagesService
