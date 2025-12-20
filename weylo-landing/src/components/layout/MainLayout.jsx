import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Mail, Megaphone, MessageCircle, Wallet, User, Settings, Moon, Sun, Bell, Search, Menu, LogOut } from 'lucide-react'
import BottomNav from './BottomNav'
import './MainLayout.css'

export default function MainLayout() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const [isOnline, setIsOnline] = useState(true)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/messages', icon: Mail, label: 'Messages', badge: user?.stats?.messages_received || 0 },
    { path: '/confessions', icon: Megaphone, label: 'Confessions', badge: user?.stats?.confessions_received || 0 },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: 3 },
    { path: '/wallet', icon: Wallet, label: 'Portefeuille' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ]

  // Streak item séparé
  const streakDays = user?.stats?.streak_days || 0

  return (
    <div className={`main-layout ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - Desktop Only */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">
            <img src="/logo.PNG" alt="Weylo" />
            <span>Weylo</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon
            const isProfilePage = item.path === '/profile'
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''} ${isProfilePage && user?.is_verified ? 'verified-item' : ''}`}
              >
                <IconComponent className="sidebar-icon" size={20} strokeWidth={2} />
                <span className="sidebar-label">
                  {item.label}
                  {isProfilePage && user?.is_verified && (
                    <span className="sidebar-verified-badge" title="Compte vérifié">✓</span>
                  )}
                </span>
                {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
              </Link>
            )
          })}

          {/* Streak Item */}
          <div className="sidebar-divider"></div>
          <div className="sidebar-item streak-item">
            <span className="streak-flame">🔥</span>
            <span className="sidebar-label">Streak</span>
            <span className="streak-badge">{streakDays}</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-item logout">
            <LogOut className="sidebar-icon" size={20} strokeWidth={2} />
            <span className="sidebar-label">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-brand">
            <Link to="/dashboard" className="navbar-logo">
              <img src="/logo.PNG" alt="Weylo" />
              <span>Weylo</span>
            </Link>
          </div>

          <div className="navbar-search">
            <Search className="search-icon" size={18} strokeWidth={2} />
            <input type="text" placeholder="Rechercher des utilisateurs..." />
          </div>

          <div className="navbar-actions">
            {/* Streak - Mobile Only */}
            <div className="navbar-streak">
              <span className="navbar-streak-flame">🔥</span>
              <span className="navbar-streak-count">{streakDays}</span>
            </div>

            <button className="navbar-btn" onClick={toggleDarkMode} title="Changer le thème">
              {darkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            </button>

            <Link to="/notifications" className="navbar-btn notification-btn" title="Notifications">
              <Bell size={20} strokeWidth={2} />
              <span className="notification-badge">5</span>
            </Link>

            <Link to="/wallet" className="navbar-btn navbar-wallet-btn" title="Portefeuille">
              <Wallet size={20} strokeWidth={2} />
              <span className="wallet-balance">
                {user?.wallet_balance || 0} FCFA
                {user?.is_verified && <span className="navbar-verified-indicator" title="Compte vérifié">✓</span>}
              </span>
            </Link>

            <Link to="/settings" className="navbar-btn navbar-settings-btn" title="Paramètres">
              <Settings size={20} strokeWidth={2} />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
