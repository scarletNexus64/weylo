import axios from 'axios'

// Base URL de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

console.log('🔧 [API_CLIENT] Configuration:', {
  baseURL: API_URL,
  env: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE
})

// Créer une instance axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 secondes
})

// Intercepteur de requête pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('weylo_token')

    console.log('📤 [API_CLIENT] REQUEST:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
      headers: config.headers,
      data: config.data
    })

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔑 [API_CLIENT] Token ajouté au header Authorization')
    } else {
      console.log('⚠️ [API_CLIENT] Pas de token trouvé dans localStorage')
    }

    return config
  },
  (error) => {
    console.error('❌ [API_CLIENT] REQUEST ERROR:', error)
    return Promise.reject(error)
  }
)

// Intercepteur de réponse pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 [API_CLIENT] RESPONSE SUCCESS:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ [API_CLIENT] RESPONSE ERROR:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers
    })

    // Si l'erreur est 401 (non authentifié), déconnecter l'utilisateur
    if (error.response?.status === 401) {
      console.log('🚪 [API_CLIENT] 401 détecté - Déconnexion automatique')
      localStorage.removeItem('weylo_token')
      localStorage.removeItem('weylo_user')
      // Rediriger vers la page d'accueil si nécessaire
      if (window.location.pathname !== '/') {
        console.log('🔄 [API_CLIENT] Redirection vers /')
        window.location.href = '/'
      }
    }

    // Si l'erreur est 403 (banni)
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Votre compte a été suspendu'
      console.error('🚫 [API_CLIENT] Account banned:', message)
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================

/**
 * Vérifier l'identité de l'utilisateur (prénom + téléphone)
 */
export const verifyIdentity = async (firstName, phone) => {
  const response = await apiClient.post('/auth/verify-identity', {
    first_name: firstName,
    phone: phone
  })
  return response.data
}

/**
 * Réinitialiser le PIN avec prénom + téléphone + nouveau PIN
 */
export const resetPasswordByPhone = async (firstName, phone, newPin) => {
  const response = await apiClient.post('/auth/reset-password-by-phone', {
    first_name: firstName,
    phone: phone,
    new_pin: newPin
  })
  return response.data
}

export default apiClient
