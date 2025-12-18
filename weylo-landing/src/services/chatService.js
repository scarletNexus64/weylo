import apiClient from './apiClient'

/**
 * Service pour gérer les conversations et messages de chat
 */
const chatService = {
  /**
   * Récupérer toutes les conversations de l'utilisateur
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de conversations par page
   */
  getConversations: async (page = 1, perPage = 50) => {
    const response = await apiClient.get('/chat/conversations', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Démarrer une nouvelle conversation
   * @param {number} userId - ID de l'utilisateur avec qui démarrer la conversation
   */
  startConversation: async (userId) => {
    const response = await apiClient.post('/chat/conversations', {
      participant_id: userId
    })
    return response.data
  },

  /**
   * Démarrer ou obtenir une conversation par username
   * @param {string} username - Nom d'utilisateur avec qui démarrer la conversation
   */
  startConversationByUsername: async (username) => {
    const response = await apiClient.post('/chat/conversations', {
      username: username
    })
    return response.data
  },

  /**
   * Récupérer les messages d'une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de messages par page
   */
  getMessages: async (conversationId, page = 1, perPage = 50) => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Envoyer un message dans une conversation
   * @param {number} conversationId - ID de la conversation
   * @param {string} content - Contenu du message
   * @param {string} type - Type de message (text, gift, system)
   * @param {number} replyToId - ID du message auquel on répond (optionnel)
   */
  sendMessage: async (conversationId, content, type = 'text', replyToId = null) => {
    const payload = {
      content,
      type
    }

    // Ajouter replyToId seulement s'il est fourni
    if (replyToId) {
      payload.reply_to_id = replyToId
    }

    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, payload)
    return response.data
  },

  /**
   * Marquer une conversation comme lue
   * @param {number} conversationId - ID de la conversation
   */
  markAsRead: async (conversationId) => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/read`)
    return response.data
  },

  /**
   * Supprimer une conversation
   * @param {number} conversationId - ID de la conversation
   */
  deleteConversation: async (conversationId) => {
    const response = await apiClient.delete(`/chat/conversations/${conversationId}`)
    return response.data
  },

  /**
   * Récupérer une conversation spécifique
   * @param {number} conversationId - ID de la conversation
   */
  getConversation: async (conversationId) => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}`)
    return response.data
  },

  /**
   * Récupérer les statistiques du chat
   */
  getStats: async () => {
    const response = await apiClient.get('/chat/stats')
    return response.data
  }
}

export default chatService
