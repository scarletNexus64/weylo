import apiClient from './apiClient'

class ConfessionsService {
  /**
   * Récupérer le feed public des confessions
   */
  async getPublicConfessions(page = 1, perPage = 20) {
    try {
      console.log('🔍 [CONFESSIONS] Récupération des confessions publiques...', { page, perPage })
      const response = await apiClient.get('/confessions', {
        params: { page, per_page: perPage }
      })
      console.log('✅ [CONFESSIONS] Confessions récupérées:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération des confessions:', error)
      throw error
    }
  }

  /**
   * Récupérer une confession spécifique
   */
  async getConfession(confessionId) {
    try {
      console.log('🔍 [CONFESSIONS] Récupération de la confession:', confessionId)
      const response = await apiClient.get(`/confessions/${confessionId}`)
      console.log('✅ [CONFESSIONS] Confession récupérée:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération de la confession:', error)
      throw error
    }
  }

  /**
   * Liker une confession
   */
  async likeConfession(confessionId) {
    try {
      console.log('❤️ [CONFESSIONS] Like de la confession:', confessionId)
      const response = await apiClient.post(`/confessions/${confessionId}/like`)
      console.log('✅ [CONFESSIONS] Confession likée:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors du like:', error)
      throw error
    }
  }

  /**
   * Unliker une confession
   */
  async unlikeConfession(confessionId) {
    try {
      console.log('💔 [CONFESSIONS] Unlike de la confession:', confessionId)
      const response = await apiClient.delete(`/confessions/${confessionId}/like`)
      console.log('✅ [CONFESSIONS] Like retiré:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors du unlike:', error)
      throw error
    }
  }

  /**
   * Créer une confession
   */
  async createConfession(data) {
    try {
      console.log('📝 [CONFESSIONS] Création d\'une confession:', data)
      const response = await apiClient.post('/confessions', data)
      console.log('✅ [CONFESSIONS] Confession créée:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la création:', error)
      throw error
    }
  }

  /**
   * Supprimer une confession
   */
  async deleteConfession(confessionId) {
    try {
      console.log('🗑️ [CONFESSIONS] Suppression de la confession:', confessionId)
      const response = await apiClient.delete(`/confessions/${confessionId}`)
      console.log('✅ [CONFESSIONS] Confession supprimée:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la suppression:', error)
      throw error
    }
  }

  /**
   * Récupérer les commentaires d'une confession
   */
  async getComments(confessionId) {
    try {
      console.log('💬 [CONFESSIONS] Récupération des commentaires:', confessionId)
      const response = await apiClient.get(`/confessions/${confessionId}/comments`)
      console.log('✅ [CONFESSIONS] Commentaires récupérés:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération des commentaires:', error)
      throw error
    }
  }

  /**
   * Ajouter un commentaire
   */
  async addComment(confessionId, content, isAnonymous = false) {
    try {
      console.log('💬 [CONFESSIONS] Ajout d\'un commentaire:', { confessionId, content, isAnonymous })
      const response = await apiClient.post(`/confessions/${confessionId}/comments`, {
        content,
        is_anonymous: isAnonymous
      })
      console.log('✅ [CONFESSIONS] Commentaire ajouté:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de l\'ajout du commentaire:', error)
      throw error
    }
  }

  /**
   * Supprimer un commentaire
   */
  async deleteComment(confessionId, commentId) {
    try {
      console.log('🗑️ [CONFESSIONS] Suppression du commentaire:', { confessionId, commentId })
      const response = await apiClient.delete(`/confessions/${confessionId}/comments/${commentId}`)
      console.log('✅ [CONFESSIONS] Commentaire supprimé:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la suppression du commentaire:', error)
      throw error
    }
  }

  /**
   * Signaler une confession
   */
  async reportConfession(confessionId, reason, description = null) {
    try {
      console.log('🚨 [CONFESSIONS] Signalement de la confession:', { confessionId, reason })
      const response = await apiClient.post(`/confessions/${confessionId}/report`, {
        reason,
        description
      })
      console.log('✅ [CONFESSIONS] Confession signalée:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors du signalement:', error)
      throw error
    }
  }

  /**
   * Récupérer mes confessions reçues
   */
  async getReceivedConfessions(page = 1, perPage = 20) {
    try {
      console.log('📥 [CONFESSIONS] Récupération des confessions reçues...', { page, perPage })
      const response = await apiClient.get('/confessions/received', {
        params: { page, per_page: perPage }
      })
      console.log('✅ [CONFESSIONS] Confessions reçues:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération des confessions reçues:', error)
      throw error
    }
  }

  /**
   * Récupérer mes confessions envoyées
   */
  async getSentConfessions(page = 1, perPage = 20) {
    try {
      console.log('📤 [CONFESSIONS] Récupération des confessions envoyées...', { page, perPage })
      const response = await apiClient.get('/confessions/sent', {
        params: { page, per_page: perPage }
      })
      console.log('✅ [CONFESSIONS] Confessions envoyées:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération des confessions envoyées:', error)
      throw error
    }
  }

  /**
   * Récupérer les statistiques
   */
  async getStats() {
    try {
      console.log('📊 [CONFESSIONS] Récupération des statistiques...')
      const response = await apiClient.get('/confessions/stats')
      console.log('✅ [CONFESSIONS] Statistiques récupérées:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [CONFESSIONS] Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }
}

export default new ConfessionsService()
