import apiClient from './apiClient'

/**
 * Service pour gérer les opérations utilisateur
 */
const userService = {
  /**
   * Récupérer le profil de l'utilisateur connecté (via dashboard)
   */
  async getDashboard() {
    try {
      const response = await apiClient.get('/users/dashboard')
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur getDashboard:', error)
      throw error
    }
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data) {
    try {
      const response = await apiClient.put('/users/profile', data)
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur updateProfile:', error)
      throw error
    }
  },

  /**
   * Mettre à jour les paramètres de confidentialité
   */
  async updateSettings(settings) {
    try {
      const response = await apiClient.put('/users/settings', settings)
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur updateSettings:', error)
      throw error
    }
  },

  /**
   * Changer le mot de passe/PIN
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/users/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword
      })
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur changePassword:', error)
      throw error
    }
  },

  /**
   * Changer le PIN directement sans l'ancien PIN (pour comptes anonymes)
   */
  async updatePinDirect(newPin) {
    try {
      const response = await apiClient.put('/auth/update-pin-direct', {
        new_pin: newPin
      })
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur updatePinDirect:', error)
      throw error
    }
  },

  /**
   * Upload d'avatar
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur uploadAvatar:', error)
      throw error
    }
  },

  /**
   * Supprimer l'avatar
   */
  async deleteAvatar() {
    try {
      const response = await apiClient.delete('/users/avatar')
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur deleteAvatar:', error)
      throw error
    }
  },

  /**
   * Supprimer le compte
   */
  async deleteAccount(password, reason = '') {
    try {
      const response = await apiClient.delete('/users/account', {
        data: { password, reason }
      })
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur deleteAccount:', error)
      throw error
    }
  },

  /**
   * Obtenir le lien de partage
   */
  async getShareLink() {
    try {
      const response = await apiClient.get('/users/share-link')
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur getShareLink:', error)
      throw error
    }
  },

  /**
   * Récupérer les statistiques de l'utilisateur
   */
  async getStats() {
    try {
      const response = await apiClient.get('/users/stats')
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur getStats:', error)
      throw error
    }
  },

  /**
   * Bloquer un utilisateur
   */
  async blockUser(username) {
    try {
      const response = await apiClient.post(`/users/${username}/block`)
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur blockUser:', error)
      throw error
    }
  },

  /**
   * Débloquer un utilisateur
   */
  async unblockUser(username) {
    try {
      const response = await apiClient.delete(`/users/${username}/block`)
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur unblockUser:', error)
      throw error
    }
  },

  /**
   * Obtenir la liste des utilisateurs bloqués
   */
  async getBlockedUsers(page = 1, perPage = 20) {
    try {
      const response = await apiClient.get('/users/blocked', {
        params: { page, per_page: perPage }
      })
      return response.data
    } catch (error) {
      console.error('❌ [USER_SERVICE] Erreur getBlockedUsers:', error)
      throw error
    }
  }
}

export default userService
