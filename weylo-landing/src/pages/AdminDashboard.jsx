import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import dashboardService from '../services/dashboardService'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState(30)
  const [maintenanceMode, setMaintenanceMode] = useState({
    enabled: false,
    message: 'Le site est actuellement en maintenance. Nous reviendrons bientôt !',
    estimated_end_time: ''
  })
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator'

  useEffect(() => {
    if (!isAdmin) {
      setError('Accès non autorisé. Vous devez être administrateur.')
      setLoading(false)
      return
    }

    loadDashboardData()
    loadMaintenanceStatus()
  }, [isAdmin, period])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, analyticsData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getAnalytics(period)
      ])
      setStats(statsData)
      setAnalytics(analyticsData)
      setError(null)
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement du dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadMaintenanceStatus = async () => {
    try {
      const response = await dashboardService.getMaintenanceStatus()
      if (response.success && response.data) {
        setMaintenanceMode({
          enabled: response.data.enabled || false,
          message: response.data.message || 'Le site est actuellement en maintenance. Nous reviendrons bientôt !',
          estimated_end_time: response.data.estimated_end_time || ''
        })
      }
    } catch (err) {
      console.error('Erreur chargement mode maintenance:', err)
    }
  }

  const handleMaintenanceToggle = async () => {
    try {
      setMaintenanceLoading(true)
      const response = await dashboardService.updateMaintenanceMode({
        enabled: !maintenanceMode.enabled,
        message: maintenanceMode.message,
        estimated_end_time: maintenanceMode.estimated_end_time || null
      })

      if (response.success) {
        setMaintenanceMode(prev => ({ ...prev, enabled: !prev.enabled }))
        alert(`Mode maintenance ${!maintenanceMode.enabled ? 'activé' : 'désactivé'} avec succès`)
      }
    } catch (err) {
      console.error('Erreur mise à jour mode maintenance:', err)
      alert('Erreur lors de la mise à jour du mode maintenance')
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const handleMaintenanceUpdate = async () => {
    try {
      setMaintenanceLoading(true)
      const response = await dashboardService.updateMaintenanceMode(maintenanceMode)

      if (response.success) {
        alert('Paramètres de maintenance mis à jour avec succès')
      }
    } catch (err) {
      console.error('Erreur mise à jour mode maintenance:', err)
      alert('Erreur lors de la mise à jour des paramètres')
    } finally {
      setMaintenanceLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="dashboard-error">
        <h2>Accès refusé</h2>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Réessayer</button>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard Administrateur</h1>
        <div className="dashboard-filters">
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={365}>1 an</option>
          </select>
        </div>
      </div>

      {/* Mode Maintenance */}
      <div className="maintenance-section">
        <div className="maintenance-header">
          <h2>Mode Maintenance</h2>
          <button
            className={`maintenance-toggle ${maintenanceMode.enabled ? 'active' : ''}`}
            onClick={handleMaintenanceToggle}
            disabled={maintenanceLoading}
          >
            {maintenanceLoading ? 'Chargement...' : (maintenanceMode.enabled ? 'Désactiver' : 'Activer')}
          </button>
        </div>
        <div className="maintenance-config">
          <div className="form-group">
            <label>Message de maintenance</label>
            <textarea
              value={maintenanceMode.message}
              onChange={(e) => setMaintenanceMode(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Message à afficher aux utilisateurs"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Fin estimée (optionnel)</label>
            <input
              type="datetime-local"
              value={maintenanceMode.estimated_end_time}
              onChange={(e) => setMaintenanceMode(prev => ({ ...prev, estimated_end_time: e.target.value }))}
            />
          </div>
          <button
            className="btn-update-maintenance"
            onClick={handleMaintenanceUpdate}
            disabled={maintenanceLoading}
          >
            Mettre à jour les paramètres
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="dashboard-stats">
        {/* Utilisateurs */}
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Utilisateurs</h3>
            <div className="stat-number">{stats?.users?.total || 0}</div>
            <div className="stat-details">
              <span className="stat-badge success">{stats?.users?.active || 0} actifs</span>
              <span className="stat-badge danger">{stats?.users?.banned || 0} bannis</span>
            </div>
            <div className="stat-trend">
              +{stats?.users?.today || 0} aujourd'hui
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="stat-card">
          <div className="stat-icon">💌</div>
          <div className="stat-content">
            <h3>Messages</h3>
            <div className="stat-number">{stats?.messages?.total || 0}</div>
            <div className="stat-trend">
              +{stats?.messages?.today || 0} aujourd'hui
            </div>
          </div>
        </div>

        {/* Stories */}
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <h3>Stories</h3>
            <div className="stat-number">{stats?.stories?.total || 0}</div>
            <div className="stat-details">
              <span className="stat-badge success">{stats?.stories?.active || 0} actives</span>
              <span className="stat-badge secondary">{stats?.stories?.expired || 0} expirées</span>
            </div>
            <div className="stat-trend">
              {Math.round(stats?.stories?.average_views || 0)} vues moy.
            </div>
          </div>
        </div>

        {/* Confessions */}
        <div className="stat-card">
          <div className="stat-icon">✍️</div>
          <div className="stat-content">
            <h3>Confessions</h3>
            <div className="stat-number">{stats?.confessions?.total || 0}</div>
            <div className="stat-details">
              <span className="stat-badge warning">{stats?.confessions?.pending || 0} en attente</span>
              <span className="stat-badge success">{stats?.confessions?.approved || 0} approuvées</span>
            </div>
          </div>
        </div>

        {/* Revenus */}
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Revenus du mois</h3>
            <div className="stat-number">{stats?.revenue?.this_month || 0} FCFA</div>
            <div className="stat-details">
              <span className="stat-badge info">
                {stats?.revenue?.platform_fees || 0} FCFA commissions
              </span>
            </div>
          </div>
        </div>

        {/* Retraits */}
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <h3>Retraits</h3>
            <div className="stat-number">{stats?.withdrawals?.pending || 0}</div>
            <div className="stat-details">
              <span className="stat-badge warning">
                {stats?.withdrawals?.pending_amount || 0} FCFA en attente
              </span>
            </div>
          </div>
        </div>

        {/* Signalements */}
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Signalements</h3>
            <div className="stat-number">{stats?.reports?.pending || 0}</div>
            <div className="stat-trend">
              {stats?.reports?.resolved_today || 0} résolus aujourd'hui
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>Conversations</h3>
            <div className="stat-number">{stats?.chat?.conversations || 0}</div>
            <div className="stat-trend">
              {stats?.chat?.active_today || 0} actives aujourd'hui
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et analytics */}
      <div className="dashboard-charts">
        {/* Top utilisateurs par stories */}
        {analytics?.rankings?.top_by_stories && analytics.rankings.top_by_stories.length > 0 && (
          <div className="chart-card">
            <h3>Top créateurs de stories</h3>
            <div className="ranking-list">
              {analytics.rankings.top_by_stories
                .filter(user => user && user.id && user.username) // Filtrer les users null/supprimés
                .map((user, index) => (
                  <div key={user.id} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">@{user.username}</span>
                    <span className="ranking-value">{user.stories_count || 0} stories</span>
                    <span className="ranking-views">{user.stories_sum_views_count || 0} vues</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top utilisateurs par messages */}
        {analytics?.rankings?.top_by_messages && analytics.rankings.top_by_messages.length > 0 && (
          <div className="chart-card">
            <h3>Top destinataires de messages</h3>
            <div className="ranking-list">
              {analytics.rankings.top_by_messages
                .filter(user => user && user.id && user.username) // Filtrer les users null/supprimés
                .map((user, index) => (
                  <div key={user.id} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">@{user.username}</span>
                    <span className="ranking-value">{user.received_messages_count || 0} messages</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top utilisateurs par cadeaux */}
        {analytics?.rankings?.top_by_gifts && analytics.rankings.top_by_gifts.length > 0 && (
          <div className="chart-card">
            <h3>Top destinataires de cadeaux</h3>
            <div className="ranking-list">
              {analytics.rankings.top_by_gifts
                .filter(user => user && user.id && user.username) // Filtrer les users null/supprimés
                .map((user, index) => (
                  <div key={user.id} className="ranking-item">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">@{user.username}</span>
                    <span className="ranking-value">{user.gifts_value || 0} FCFA</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
