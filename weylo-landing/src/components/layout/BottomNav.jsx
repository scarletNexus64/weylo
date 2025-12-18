import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Home, Mail, Megaphone, MessageCircle, User, Users } from 'lucide-react'
import chatService from '../../services/chatService'
import messagesService from '../../services/messagesService'
import groupsService from '../../services/groupsService'
import './BottomNav.css'

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0)
  const [groupsCount, setGroupsCount] = useState(0)

  // Charger les stats au montage et les rafraîchir périodiquement
  useEffect(() => {
    if (!isAuthenticated) return

    const loadStats = async () => {
      try {
        // Charger les stats du chat
        const chatStats = await chatService.getStats()
        setChatUnreadCount(chatStats.unread_conversations || 0)

        // Charger les stats des messages anonymes
        const messagesStats = await messagesService.getStats()
        setMessagesUnreadCount(messagesStats.unread_count || 0)

        // Charger les stats des groupes
        const groupsStats = await groupsService.getStats()
        setGroupsCount(groupsStats.total_groups || 0)
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
      }
    }

    loadStats()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadStats, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/messages', icon: Mail, label: 'Messages', badge: messagesUnreadCount },
    { path: '/groups', icon: Users, label: 'Groupes', badge: groupsCount > 0 ? groupsCount : 0 },
    { path: '/chat', icon: MessageCircle, label: 'Chat', badge: chatUnreadCount },
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
