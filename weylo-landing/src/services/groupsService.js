import apiClient from './apiClient'

/**
 * Service pour gérer les groupes anonymes
 */
const groupsService = {
  /**
   * Récupérer tous les groupes de l'utilisateur
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de groupes par page
   */
  getGroups: async (page = 1, perPage = 50) => {
    const response = await apiClient.get('/groups', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Créer un nouveau groupe
   * @param {Object} groupData - Données du groupe
   * @param {string} groupData.name - Nom du groupe
   * @param {string} groupData.description - Description du groupe
   * @param {boolean} groupData.is_public - Si le groupe est public
   * @param {number} groupData.max_members - Nombre maximum de membres
   */
  createGroup: async (groupData) => {
    const response = await apiClient.post('/groups', groupData)
    return response.data
  },

  /**
   * Rejoindre un groupe via code d'invitation
   * @param {string} inviteCode - Code d'invitation du groupe
   */
  joinGroup: async (inviteCode) => {
    const response = await apiClient.post('/groups/join', {
      invite_code: inviteCode
    })
    return response.data
  },

  /**
   * Récupérer les détails d'un groupe
   * @param {number} groupId - ID du groupe
   */
  getGroup: async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}`)
    return response.data
  },

  /**
   * Mettre à jour un groupe
   * @param {number} groupId - ID du groupe
   * @param {Object} groupData - Nouvelles données du groupe
   */
  updateGroup: async (groupId, groupData) => {
    const response = await apiClient.put(`/groups/${groupId}`, groupData)
    return response.data
  },

  /**
   * Supprimer un groupe
   * @param {number} groupId - ID du groupe
   */
  deleteGroup: async (groupId) => {
    const response = await apiClient.delete(`/groups/${groupId}`)
    return response.data
  },

  /**
   * Quitter un groupe
   * @param {number} groupId - ID du groupe
   */
  leaveGroup: async (groupId) => {
    const response = await apiClient.post(`/groups/${groupId}/leave`)
    return response.data
  },

  /**
   * Récupérer les messages d'un groupe
   * @param {number} groupId - ID du groupe
   * @param {number} page - Numéro de la page
   * @param {number} perPage - Nombre de messages par page
   */
  getMessages: async (groupId, page = 1, perPage = 50) => {
    const response = await apiClient.get(`/groups/${groupId}/messages`, {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Envoyer un message dans un groupe
   * @param {number} groupId - ID du groupe
   * @param {string} content - Contenu du message
   * @param {number} replyToMessageId - ID du message auquel on répond (optionnel)
   */
  sendMessage: async (groupId, content, replyToMessageId = null) => {
    const response = await apiClient.post(`/groups/${groupId}/messages`, {
      content,
      reply_to_message_id: replyToMessageId
    })
    return response.data
  },

  /**
   * Marquer les messages d'un groupe comme lus
   * @param {number} groupId - ID du groupe
   */
  markAsRead: async (groupId) => {
    const response = await apiClient.post(`/groups/${groupId}/read`)
    return response.data
  },

  /**
   * Récupérer les membres d'un groupe
   * @param {number} groupId - ID du groupe
   */
  getMembers: async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/members`)
    return response.data
  },

  /**
   * Retirer un membre du groupe
   * @param {number} groupId - ID du groupe
   * @param {number} memberId - ID du membre
   */
  removeMember: async (groupId, memberId) => {
    const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`)
    return response.data
  },

  /**
   * Changer le rôle d'un membre
   * @param {number} groupId - ID du groupe
   * @param {number} memberId - ID du membre
   * @param {string} role - Nouveau rôle (admin, moderator, member)
   */
  updateMemberRole: async (groupId, memberId, role) => {
    const response = await apiClient.put(`/groups/${groupId}/members/${memberId}/role`, {
      role
    })
    return response.data
  },

  /**
   * Régénérer le code d'invitation
   * @param {number} groupId - ID du groupe
   */
  regenerateInviteCode: async (groupId) => {
    const response = await apiClient.post(`/groups/${groupId}/regenerate-invite`)
    return response.data
  },

  /**
   * Récupérer les statistiques des groupes
   */
  getStats: async () => {
    const response = await apiClient.get('/groups/stats')
    return response.data
  }
}

export default groupsService
