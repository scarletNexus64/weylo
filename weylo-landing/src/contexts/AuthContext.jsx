import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('weylo_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Mock login function
  const login = async (credentials) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockUser = {
      id: 1,
      username: credentials.username || 'john_doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+237612345678',
      avatar: null,
      bio: 'Hey there! I\'m using Weylo 🎭',
      wallet_balance: 15000,
      is_premium: false,
      created_at: new Date().toISOString(),
      stats: {
        messages_received: 42,
        messages_sent: 28,
        confessions_received: 15,
        gifts_received: 8,
        streak_days: 7
      }
    }

    setUser(mockUser)
    localStorage.setItem('weylo_user', JSON.stringify(mockUser))
    localStorage.setItem('weylo_token', 'mock_token_12345')

    return mockUser
  }

  // Mock register function
  const register = async (data) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockUser = {
      id: 2,
      username: data.first_name.toLowerCase() + Math.floor(Math.random() * 1000),
      first_name: data.first_name,
      last_name: '',
      email: `${data.first_name}@weylo.temp`,
      phone: data.phone,
      avatar: null,
      bio: '',
      wallet_balance: 0,
      is_premium: false,
      created_at: new Date().toISOString(),
      stats: {
        messages_received: 0,
        messages_sent: 0,
        confessions_received: 0,
        gifts_received: 0,
        streak_days: 0
      }
    }

    setUser(mockUser)
    localStorage.setItem('weylo_user', JSON.stringify(mockUser))
    localStorage.setItem('weylo_token', 'mock_token_' + Math.random())

    return mockUser
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('weylo_user')
    localStorage.removeItem('weylo_token')
  }

  // Update user
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('weylo_user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
