import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Mail, Megaphone, MessageCircle, User } from 'lucide-react'
import './BottomNav.css'

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/messages', icon: Mail, label: 'Messages', badge: user?.stats?.messages_received || 0 },
    { path: '/confessions', icon: Megaphone, label: 'Feed', badge: user?.stats?.confessions_received || 0 },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: 3 },
    { path: '/profile', icon: User, label: 'Profil' }
  ]

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon-wrapper">
                {item.badge > 0 && (
                  <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
                )}
                <IconComponent className="nav-icon" size={24} strokeWidth={2} />
              </div>
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && (
                <div className="nav-indicator"></div>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
