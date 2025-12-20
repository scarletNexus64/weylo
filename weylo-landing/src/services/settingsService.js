import apiClient from './apiClient'

/**
 * Service pour gérer les paramètres publics de l'application
 */
const settingsService = {
  /**
   * Récupérer tous les paramètres publics
   */
  getPublicSettings: async () => {
    const response = await apiClient.get('/settings/public')
    return response.data
  },

  /**
   * Récupérer le prix pour révéler l'identité d'un message anonyme
   */
  getRevealPrice: async () => {
    const response = await apiClient.get('/settings/reveal-price')
    return response.data
  }
}

export default settingsService
