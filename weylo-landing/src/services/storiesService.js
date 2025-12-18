import apiClient from './apiClient'

/**
 * Service pour gérer les Stories
 */
const storiesService = {
  /**
   * Récupérer le feed des stories
   */
  getStoriesFeed: async () => {
    const response = await apiClient.get('/stories')
    return response.data
  },

  /**
   * Récupérer les stories d'un utilisateur par username
   */
  getUserStories: async (username) => {
    const response = await apiClient.get(`/stories/user/${username}`)
    return response.data
  },

  /**
   * Récupérer les stories d'un utilisateur par ID
   */
  getUserStoriesById: async (userId) => {
    const response = await apiClient.get(`/stories/user-by-id/${userId}`)
    return response.data
  },

  /**
   * Récupérer mes stories
   */
  getMyStories: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/stories/my-stories', {
      params: { page, per_page: perPage }
    })
    return response.data
  },

  /**
   * Voir une story
   */
  getStory: async (storyId) => {
    const response = await apiClient.get(`/stories/${storyId}`)
    return response.data
  },

  /**
   * Créer une story
   */
  createStory: async (formData) => {
    const response = await apiClient.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Marquer une story comme vue
   */
  markAsViewed: async (storyId) => {
    const response = await apiClient.post(`/stories/${storyId}/view`)
    return response.data
  },

  /**
   * Obtenir les viewers d'une story
   */
  getViewers: async (storyId) => {
    const response = await apiClient.get(`/stories/${storyId}/viewers`)
    return response.data
  },

  /**
   * Supprimer une story
   */
  deleteStory: async (storyId) => {
    const response = await apiClient.delete(`/stories/${storyId}`)
    return response.data
  },

  /**
   * Obtenir les statistiques des stories
   */
  getStats: async () => {
    const response = await apiClient.get('/stories/stats')
    return response.data
  }
}

export default storiesService
