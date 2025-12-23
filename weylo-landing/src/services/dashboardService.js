import apiClient from './apiClient'

/**
 * Service pour le Dashboard Admin
 */
const dashboardService = {
  /**
   * Récupérer les statistiques globales du dashboard
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  /**
   * Récupérer les analytics détaillées
   */
  getAnalytics: async (period = 30) => {
    const response = await apiClient.get('/admin/analytics', {
      params: { period }
    })
    return response.data
  },

  /**
   * Récupérer les revenus détaillés
   */
  getRevenue: async (from, to) => {
    const response = await apiClient.get('/admin/revenue', {
      params: { from, to }
    })
    return response.data
  },

  /**
   * Récupérer l'activité récente
   */
  getRecentActivity: async () => {
    const response = await apiClient.get('/admin/recent-activity')
    return response.data
  },

  /**
   * Récupérer le statut du mode maintenance
   */
  getMaintenanceStatus: async () => {
    const response = await apiClient.get('/maintenance/status')
    return response.data
  },

  /**
   * Mettre à jour le mode maintenance
   */
  updateMaintenanceMode: async (data) => {
    const response = await apiClient.put('/admin/maintenance/update', data)
    return response.data
  }
}

export default dashboardService
