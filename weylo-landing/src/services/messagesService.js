import apiClient from './apiClient'

/**
 * Service pour gérer les messages anonymes
 */
const messagesService = {
  /**
   * Récupérer les messages reçus (paginés)
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de messages par page
   */
  getReceivedMessages: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/messages', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Récupérer les messages envoyés (paginés)
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de messages par page
   */
  getSentMessages: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/messages/sent', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Récupérer les statistiques des messages
   */
  getStats: async () => {
    const response = await apiClient.get('/messages/stats')
    return response.data
  },

  /**
   * Récupérer un message spécifique
   * @param {number} messageId - ID du message
   */
  getMessage: async (messageId) => {
    const response = await apiClient.get(`/messages/${messageId}`)
    return response.data
  },

  /**
   * Envoyer un message anonyme
   * @param {string} username - Nom d'utilisateur du destinataire
   * @param {string} content - Contenu du message
   * @param {number} replyToMessageId - ID du message auquel on répond (optionnel)
   */
  sendMessage: async (username, content, replyToMessageId = null) => {
    const response = await apiClient.post(`/messages/send/${username}`, {
      content,
      reply_to_message_id: replyToMessageId
    })
    return response.data
  },

  /**
   * Révéler l'identité de l'expéditeur (premium)
   * @param {number} messageId - ID du message
   */
  revealIdentity: async (messageId) => {
    const response = await apiClient.post(`/messages/${messageId}/reveal`)
    return response.data
  },

  /**
   * Supprimer un message
   * @param {number} messageId - ID du message
   */
  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/messages/${messageId}`)
    return response.data
  },

  /**
   * Signaler un message
   * @param {number} messageId - ID du message
   * @param {string} reason - Raison du signalement
   * @param {string} description - Description du signalement (optionnel)
   */
  reportMessage: async (messageId, reason, description = null) => {
    const response = await apiClient.post(`/messages/${messageId}/report`, {
      reason,
      description
    })
    return response.data
  },

  /**
   * Marquer tous les messages comme lus
   */
  markAllAsRead: async () => {
    const response = await apiClient.post('/messages/read-all')
    return response.data
  },

  /**
   * Démarrer une conversation à partir d'un message anonyme
   * @param {number} messageId - ID du message
   */
  startConversationFromMessage: async (messageId) => {
    const response = await apiClient.post(`/messages/${messageId}/start-conversation`)
    return response.data
  }
}

export default messagesService
