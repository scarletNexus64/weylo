import apiClient from './apiClient'

/**
 * Service pour gérer les abonnements Premium
 */
const premiumService = {
  /**
   * S'abonner à une story pour révéler l'identité
   */
  subscribeToStory: async (storyId) => {
    const response = await apiClient.post(`/premium/subscribe/story/${storyId}`)
    return response.data
  },

  /**
   * Vérifier si l'utilisateur a un premium actif
   */
  checkPremium: async (type, id) => {
    const response = await apiClient.get('/premium/check', {
      params: { type, id }
    })
    return response.data
  },

  /**
   * Obtenir les abonnements actifs
   */
  getActiveSubscriptions: async () => {
    const response = await apiClient.get('/premium/subscriptions/active')
    return response.data
  },

  /**
   * Obtenir les informations de prix
   */
  getPricing: async () => {
    const response = await apiClient.get('/premium/pricing')
    return response.data
  },

  /**
   * Annuler un abonnement
   */
  cancelSubscription: async (subscriptionId) => {
    const response = await apiClient.post(`/premium/cancel/${subscriptionId}`)
    return response.data
  }
}

export default premiumService
