import apiClient from './apiClient'

/**
 * Service pour gérer le Passe Premium global
 */
const premiumPassService = {
  /**
   * Obtenir les informations sur le passe premium
   */
  getInfo: async () => {
    const response = await apiClient.get('/premium-pass/info')
    return response.data
  },

  /**
   * Obtenir le statut premium de l'utilisateur connecté
   */
  getStatus: async () => {
    const response = await apiClient.get('/premium-pass/status')
    return response.data
  },

  /**
   * Acheter le passe premium via le wallet
   */
  purchase: async (autoRenew = false) => {
    const response = await apiClient.post('/premium-pass/purchase', {
      auto_renew: autoRenew
    })
    return response.data
  },

  /**
   * Renouveler le passe premium
   */
  renew: async (autoRenew = false) => {
    const response = await apiClient.post('/premium-pass/renew', {
      auto_renew: autoRenew
    })
    return response.data
  },

  /**
   * Activer le renouvellement automatique
   */
  enableAutoRenew: async () => {
    const response = await apiClient.post('/premium-pass/auto-renew/enable')
    return response.data
  },

  /**
   * Désactiver le renouvellement automatique
   */
  disableAutoRenew: async () => {
    const response = await apiClient.post('/premium-pass/auto-renew/disable')
    return response.data
  },

  /**
   * Obtenir l'historique des passes premium
   */
  getHistory: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/premium-pass/history', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Vérifier si l'utilisateur peut voir l'identité d'un autre utilisateur
   */
  canViewIdentity: async (userId) => {
    const response = await apiClient.get(`/premium-pass/can-view-identity/${userId}`)
    return response.data
  }
}

export default premiumPassService
