import { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import websocketService from '../services/websocketService'

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

  // Initialiser le WebSocket lorsque l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('weylo_token')
      if (token) {
        console.log('🌐 [AUTH_CONTEXT] Initialisation du WebSocket pour l\'utilisateur', user.id)
        websocketService.connect(token, user.id)
      }
    } else {
      // Déconnecter le WebSocket si l'utilisateur se déconnecte
      console.log('🚪 [AUTH_CONTEXT] Déconnexion du WebSocket')
      websocketService.disconnect()
    }

    // Cleanup lors du démontage
    return () => {
      if (!user) {
        websocketService.disconnect()
      }
    }
  }, [user])

  // Check if user is logged in and verify token
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 [AUTH_CONTEXT] Initialisation de l\'authentification...')

      const storedToken = localStorage.getItem('weylo_token')
      const storedUser = localStorage.getItem('weylo_user')

      console.log('💾 [AUTH_CONTEXT] localStorage check:', {
        hasToken: !!storedToken,
        token: storedToken ? `${storedToken.substring(0, 20)}...` : null,
        hasUser: !!storedUser,
        user: storedUser ? JSON.parse(storedUser).username : null
      })

      if (storedToken && storedUser) {
        try {
          console.log('✅ [AUTH_CONTEXT] Token trouvé, vérification auprès du serveur...')
          // Vérifier si le token est valide en récupérant l'utilisateur actuel avec ses stats
          const response = await apiClient.get('/users/dashboard')
          console.log('✅ [AUTH_CONTEXT] Token valide! Utilisateur:', response.data.user)
          // Fusionner les données utilisateur avec les stats
          const userWithStats = {
            ...response.data.user,
            stats: response.data.stats
          }
          setUser(userWithStats)
          localStorage.setItem('weylo_user', JSON.stringify(userWithStats))
        } catch (error) {
          // Si le token est invalide, nettoyer le localStorage
          console.error('❌ [AUTH_CONTEXT] Token invalide:', error)
          console.log('🧹 [AUTH_CONTEXT] Nettoyage du localStorage...')
          localStorage.removeItem('weylo_token')
          localStorage.removeItem('weylo_user')
          setUser(null)
        }
      } else {
        console.log('ℹ️ [AUTH_CONTEXT] Aucun token trouvé - utilisateur non connecté')
      }

      setLoading(false)
      console.log('✅ [AUTH_CONTEXT] Initialisation terminée')
    }

    initAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    console.log('🔑 [AUTH_CONTEXT] Tentative de connexion...', {
      username: credentials.username,
      hasPassword: !!credentials.password
    })

    try {
      const response = await apiClient.post('/auth/login', {
        login: credentials.username, // Le backend accepte email ou phone dans le champ 'login'
        password: credentials.password
      })

      const { user, token } = response.data

      console.log('✅ [AUTH_CONTEXT] Connexion réussie!', {
        user: user,
        token: token ? `${token.substring(0, 20)}...` : null
      })

      // Sauvegarder le token d'abord pour les requêtes suivantes
      localStorage.setItem('weylo_token', token)

      // Charger les stats de l'utilisateur
      try {
        const dashboardResponse = await apiClient.get('/users/dashboard')
        const userWithStats = {
          ...dashboardResponse.data.user,
          stats: dashboardResponse.data.stats
        }
        setUser(userWithStats)
        localStorage.setItem('weylo_user', JSON.stringify(userWithStats))
        console.log('💾 [AUTH_CONTEXT] Utilisateur avec stats sauvegardé')
        return userWithStats
      } catch (statsError) {
        // Fallback: utiliser les données de base sans stats
        console.warn('⚠️ [AUTH_CONTEXT] Impossible de charger les stats, utilisation des données de base')
        setUser(user)
        localStorage.setItem('weylo_user', JSON.stringify(user))
        return user
      }
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Erreur de connexion:', error)
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.errors?.login?.[0] ||
                          'Erreur de connexion. Vérifiez vos identifiants.'
      console.error('❌ [AUTH_CONTEXT] Message d\'erreur:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Register function
  const register = async (data) => {
    console.log('📝 [AUTH_CONTEXT] Tentative d\'inscription...', {
      first_name: data.first_name,
      phone: data.phone,
      hasPassword: !!(data.password || data.pin)
    })

    try {
      // Préparer les données pour l'API
      const payload = {
        first_name: data.first_name,
        phone: data.phone,
        password: data.pin || data.password // Utiliser pin s'il existe, sinon password
      }

      console.log('📋 [AUTH_CONTEXT] Payload envoyé:', payload)

      const response = await apiClient.post('/auth/register', payload)

      const { user, token } = response.data

      console.log('✅ [AUTH_CONTEXT] Inscription réussie!', {
        user: user,
        token: token ? `${token.substring(0, 20)}...` : null
      })

      // Sauvegarder le token d'abord pour les requêtes suivantes
      localStorage.setItem('weylo_token', token)

      // Charger les stats de l'utilisateur
      try {
        const dashboardResponse = await apiClient.get('/users/dashboard')
        const userWithStats = {
          ...dashboardResponse.data.user,
          stats: dashboardResponse.data.stats
        }
        setUser(userWithStats)
        localStorage.setItem('weylo_user', JSON.stringify(userWithStats))
        console.log('💾 [AUTH_CONTEXT] Utilisateur avec stats sauvegardé')
        return userWithStats
      } catch (statsError) {
        // Fallback: utiliser les données de base sans stats
        console.warn('⚠️ [AUTH_CONTEXT] Impossible de charger les stats, utilisation des données de base')
        setUser(user)
        localStorage.setItem('weylo_user', JSON.stringify(user))
        return user
      }
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Erreur d\'inscription:', error)
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.errors?.phone?.[0] ||
                          error.response?.data?.errors?.password?.[0] ||
                          'Erreur lors de l\'inscription.'
      console.error('❌ [AUTH_CONTEXT] Message d\'erreur:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Logout function
  const logout = async () => {
    console.log('🚪 [AUTH_CONTEXT] Tentative de déconnexion...')

    try {
      // Appeler l'API pour révoquer le token
      await apiClient.post('/auth/logout')
      console.log('✅ [AUTH_CONTEXT] Token révoqué côté serveur')
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      console.log('🧹 [AUTH_CONTEXT] Nettoyage du localStorage...')
      setUser(null)
      localStorage.removeItem('weylo_user')
      localStorage.removeItem('weylo_token')
      console.log('✅ [AUTH_CONTEXT] Déconnexion terminée')
    }
  }

  // Update user
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('weylo_user', JSON.stringify(updatedUser))
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/users/dashboard')
      // Fusionner les données utilisateur avec les stats
      const userWithStats = {
        ...response.data.user,
        stats: response.data.stats
      }
      setUser(userWithStats)
      localStorage.setItem('weylo_user', JSON.stringify(userWithStats))
      return userWithStats
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
