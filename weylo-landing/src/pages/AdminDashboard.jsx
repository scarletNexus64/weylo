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

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator'

  useEffect(() => {
    if (!isAdmin) {
      setError('Accès non autorisé. Vous devez être administrateur.')
      setLoading(false)
      return
    }

    loadDashboardData()
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
              {analytics.rankings.top_by_stories.map((user, index) => (
                <div key={user.id} className="ranking-item">
                  <span className="ranking-position">#{index + 1}</span>
                  <span className="ranking-name">@{user.username}</span>
                  <span className="ranking-value">{user.stories_count} stories</span>
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
              {analytics.rankings.top_by_messages.map((user, index) => (
                <div key={user.id} className="ranking-item">
                  <span className="ranking-position">#{index + 1}</span>
                  <span className="ranking-name">@{user.username}</span>
                  <span className="ranking-value">{user.received_messages_count} messages</span>
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
              {analytics.rankings.top_by_gifts.map((user, index) => (
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
