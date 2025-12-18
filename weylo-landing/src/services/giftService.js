import apiClient from './apiClient'

/**
 * Service pour gérer les cadeaux
 */
const giftService = {
  /**
   * Récupérer le catalogue de cadeaux
   */
  getCatalog: async () => {
    const response = await apiClient.get('/gifts')
    return response.data
  },

  /**
   * Récupérer un cadeau spécifique
   * @param {number} giftId - ID du cadeau
   */
  getGift: async (giftId) => {
    const response = await apiClient.get(`/gifts/${giftId}`)
    return response.data
  },

  /**
   * Envoyer un cadeau à un utilisateur
   * @param {string} recipientUsername - Nom d'utilisateur du destinataire
   * @param {number} giftId - ID du cadeau
   * @param {string} message - Message optionnel
   */
  sendGift: async (recipientUsername, giftId, message = null) => {
    const response = await apiClient.post('/gifts/send', {
      recipient_username: recipientUsername,
      gift_id: giftId,
      message
    })
    return response.data
  },

  /**
   * Envoyer un cadeau dans une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {number} giftId - ID du cadeau
   * @param {string} message - Message optionnel
   */
  sendInConversation: async (conversationId, giftId, message = null) => {
    const response = await apiClient.post(`/conversations/${conversationId}/gift`, {
      gift_id: giftId,
      message
    })
    return response.data
  },

  /**
   * Récupérer les cadeaux reçus
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre par page
   */
  getReceivedGifts: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/gifts/received', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Récupérer les cadeaux envoyés
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre par page
   */
  getSentGifts: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/gifts/sent', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Récupérer les statistiques des cadeaux
   */
  getStats: async () => {
    const response = await apiClient.get('/gifts/stats')
    return response.data
  }
}

export default giftService
