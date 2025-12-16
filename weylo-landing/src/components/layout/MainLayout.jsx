import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Mail, Megaphone, MessageCircle, Gift, Wallet, User, Settings, Moon, Sun, Bell, Search, Menu, LogOut } from 'lucide-react'
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
    { path: '/gifts', icon: Gift, label: 'Cadeaux', badge: user?.stats?.gifts_received || 0 },
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
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <IconComponent className="sidebar-icon" size={20} strokeWidth={2} />
                <span className="sidebar-label">{item.label}</span>
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

            <Link to="/gifts" className="navbar-btn navbar-gifts-btn" title="Cadeaux">
              <Gift size={20} strokeWidth={2} />
            </Link>

            <Link to="/notifications" className="navbar-btn notification-btn" title="Notifications">
              <Bell size={20} strokeWidth={2} />
              <span className="notification-badge">5</span>
            </Link>

            <Link to="/settings" className="navbar-btn navbar-settings-btn" title="Paramètres">
              <Settings size={20} strokeWidth={2} />
            </Link>

            <Link to="/profile" className="navbar-user">
              <div className="user-avatar-wrapper">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.first_name} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar">{user?.first_name?.[0]?.toUpperCase()}</div>
                )}
                <span className={`online-status ${isOnline ? 'online' : 'offline'}`}></span>
              </div>
              <span className="user-name">{user?.first_name}</span>
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
