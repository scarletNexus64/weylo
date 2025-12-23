import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import messagesService from '../services/messagesService'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'

export default function SendMessagePage() {
  const { userId, username } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, loading: authLoading, loginWithToken } = useAuth()
  const { success: showSuccess, error: showError, info } = useDialog()

  const [recipientUsername, setRecipientUsername] = useState(null)
  const [recipientFirstName, setRecipientFirstName] = useState(null)
  const [userExists, setUserExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Dark mode et scroll effect
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Vérifier que l'utilisateur existe
  useEffect(() => {
    const checkUser = async () => {
      try {
        let response

        // Si on a un username, utiliser l'endpoint by-username
        if (username) {
          response = await apiClient.get(`/users/by-username/${username}`)
        }
        // Sinon, utiliser l'ancien endpoint by-id
        else if (userId) {
          response = await apiClient.get(`/users/by-id/${userId}`)
        } else {
          setError('Lien invalide')
          setUserExists(false)
          setLoading(false)
          return
        }

        setRecipientUsername(response.data.user.username)
        setRecipientFirstName(response.data.user.first_name)
        setUserExists(true)
      } catch (err) {
        console.error('Error checking user:', err)
        setError('Ce lien n\'est pas valide')
        setUserExists(false)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [userId, username])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!message.trim()) {
      setError('Veuillez entrer un message')
      return
    }

    setError('')
    setSending(true)

    try {
      if (isAuthenticated) {
        // Utilisateur connecté → envoyer le message directement via messagesService
        console.log('👤 Utilisateur connecté, envoi du message anonyme vers:', recipientUsername)
        await messagesService.sendMessage(recipientUsername, message)
        console.log('✅ Message envoyé avec succès')

        setSuccess(true)
        setMessage('')

        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)

      } else {
        // Utilisateur non connecté → créer compte fake et envoyer
        console.log('👻 Utilisateur non connecté, création de compte anonyme et envoi...')

        const response = await apiClient.post('/auth/register-and-send', {
          recipient_username: recipientUsername,
          message: message
        })

        console.log('✅ Compte créé et message envoyé!', response.data)

        const { token, credentials } = response.data.data

        // Auto-login avec le token
        await loginWithToken(token, response.data.data.user)

        setSuccess(true)
        setMessage('')

        // Afficher les credentials avec tips
        setTimeout(() => {
          info(
            `🎉 Message envoyé avec succès !\n\n` +
            `Votre compte anonyme a été créé :\n\n` +
            `👤 Username: ${credentials.username}\n` +
            `🔐 Code PIN: ${credentials.password}\n\n` +
            `💡 Conseil : Vous pouvez personnaliser votre profil (nom, téléphone, PIN) dans les paramètres pour sécuriser votre compte.\n\n` +
            `Redirection vers le dashboard...`,
            15000 // Afficher pendant 15 secondes
          )

          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 2000)
        }, 500)
      }

    } catch (err) {
      console.error('❌ Erreur lors de l\'envoi:', err)
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50'} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          <p className={`mt-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !userExists) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50'} flex items-center justify-center p-4 transition-colors duration-300`}>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl shadow-lg p-8 max-w-md w-full text-center`}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lien invalide</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition transform hover:scale-105"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ${
      darkMode
        ? 'dark bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50'
    }`}>
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 -left-4 w-72 h-72 ${darkMode ? 'bg-purple-600' : 'bg-purple-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`}></div>
        <div className={`absolute top-0 -right-4 w-72 h-72 ${darkMode ? 'bg-pink-600' : 'bg-pink-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000`}></div>
        <div className={`absolute -bottom-8 left-20 w-72 h-72 ${darkMode ? 'bg-fuchsia-600' : 'bg-fuchsia-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000`}></div>
        <div className={`absolute bottom-20 right-20 w-72 h-72 ${darkMode ? 'bg-rose-600' : 'bg-rose-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-3000`}></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? `${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md shadow-lg border-b ${darkMode ? 'border-gray-700' : 'border-purple-100'}`
          : `${darkMode ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm`
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group animate-slideInLeft" onClick={() => navigate('/')}>
              <div className="relative">
                <img
                  src="/logo.PNG"
                  alt="Weylo Logo"
                  className="w-10 h-10 md:w-12 md:h-12 object-contain transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                  Weylo
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Messages anonymes</p>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2 md:gap-4 animate-slideInRight">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                  darkMode
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Home Button */}
              <button
                onClick={() => navigate('/')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  darkMode
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                } shadow-lg hover:shadow-xl`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden md:inline text-sm">Accueil</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block p-4 md:p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-6 animate-float shadow-2xl">
            <svg className={`w-12 h-12 md:w-16 md:h-16 ${darkMode ? 'text-purple-400' : 'text-purple-600'} animate-pulse-slow`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className={`text-3xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} animate-fadeInUp leading-tight`}>
            {recipientFirstName || 'Cette personne'} va recevoir
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              ton message secret...
            </span>
          </h2>
          <p className={`text-base md:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto animate-fadeInUp animation-delay-200 leading-relaxed`}>
            Qu'est-ce que tu veux lui dire anonymement ? 🎭
          </p>
        </div>

        {/* Message Form Card */}
        <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80'} backdrop-blur-xl rounded-3xl shadow-2xl border ${darkMode ? '' : 'border-purple-100'} overflow-hidden mb-8 animate-scaleIn animation-delay-400 hover:shadow-purple-500/20 transition-all duration-500`}>
          <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700 bg-gradient-to-r from-purple-900/30 to-pink-900/30' : 'border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-shimmer"></div>
            <div className="flex items-center relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg animate-bounce-slow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ton message anonyme
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isAuthenticated ? 'Ton identité restera secrète 🤫' : 'Un compte anonyme sera créé automatiquement 🎭'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Message Textarea */}
            <div className="mb-6">
              <label htmlFor="message" className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <svg className="w-4 h-4 inline text-purple-500 mr-2 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Ton message
              </label>
              <div className="relative group">
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 resize-none transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:bg-gray-900'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:bg-purple-50/30'
                  } hover:border-purple-300 hover:shadow-lg group-hover:scale-[1.01]`}
                  placeholder="Écris ton message ici... Personne ne saura que c'est toi 😊"
                  required
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className={`text-xs flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">100% anonyme et sécurisé</span>
                </p>
                <span className={`text-xs font-bold transition-all duration-300 ${
                  message.length > 900 ? 'text-orange-500 scale-110' :
                  message.length > 950 ? 'text-red-500 scale-110 animate-pulse' :
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.length}/1000
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-shake relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-rose-100/50 dark:from-red-900/30 dark:to-rose-900/30 animate-pulse-slow"></div>
                <div className="flex items-start gap-3 relative z-10">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-400 font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl animate-scaleIn relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 animate-shimmer"></div>
                <div className="flex items-start gap-3 relative z-10">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-400 font-semibold">Message envoyé avec succès ! 🎉</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending}
              className={`w-full relative overflow-hidden text-white font-black py-5 px-8 rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group animate-pulse-button bg-[length:200%_auto] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600`}
            >
              {/* Animated shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

              {/* Gradient overlay on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient-x bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600"></span>

              {/* Animated particles */}
              <span className="absolute top-2 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-particle-1"></span>
              <span className="absolute bottom-2 right-1/4 w-2 h-2 bg-white/50 rounded-full animate-particle-2"></span>
              <span className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/50 rounded-full animate-particle-3"></span>

              <span className="relative z-10 flex items-center justify-center gap-3 text-base md:text-lg">
                {sending ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse">Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="group-hover:tracking-wider transition-all duration-300">
                      {isAuthenticated ? 'Envoyer le message' : 'Envoyer anonymement'}
                    </span>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Info Card */}
          <div className={`${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white/60'} backdrop-blur-xl rounded-2xl shadow-xl border ${darkMode ? '' : 'border-purple-100'} p-6 hover:shadow-2xl transition-all duration-300 hover:border-purple-300 animate-slideInLeft animation-delay-600`}>
            <h4 className={`font-bold mb-4 flex items-center gap-2 text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-6 h-6 text-purple-500 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Pourquoi Weylo ?
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                'Messages 100% anonymes et sécurisés',
                'Compte créé automatiquement en 1 clic',
                'Chat en temps réel avec streaks 🔥',
                'Cadeaux virtuels et confessions'
              ].map((feature, index) => (
                <li key={index} className={`flex items-start gap-3 animate-slideInLeft animation-delay-${700 + index * 100} hover:translate-x-2 transition-transform duration-300 group`}>
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats Card */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'} backdrop-blur-xl rounded-2xl shadow-xl border p-6 hover:shadow-2xl transition-all duration-300 animate-slideInRight animation-delay-600`}>
            <h4 className={`font-bold mb-4 flex items-center gap-2 text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-6 h-6 text-pink-500 animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Statistiques en direct
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Utilisateurs actifs', value: '500K+', icon: '👥', color: 'purple' },
                { label: 'Messages envoyés', value: '10M+', icon: '💌', color: 'pink' },
                { label: 'Note moyenne', value: '4.8/5', icon: '⭐', color: 'yellow' }
              ].map((stat, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} hover:scale-105 transition-transform duration-300 animate-slideInRight animation-delay-${700 + index * 100}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stat.label}</span>
                  </div>
                  <span className={`text-xl font-black bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-400 bg-clip-text text-transparent`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 mt-12 pb-8 border-t ${darkMode ? 'border-gray-800' : 'border-purple-100'}`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} animate-fadeInUp animation-delay-1000`}>
            © {new Date().getFullYear()} Weylo. Tous droits réservés.
          </p>
          <div className={`mt-3 flex items-center justify-center flex-wrap gap-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} animate-fadeInUp animation-delay-1100`}>
            <a href="#" className={`hover:text-purple-600 transition-all duration-300 hover:scale-110 font-medium ${darkMode ? 'hover:text-purple-400' : ''}`}>Conditions</a>
            <span className="animate-pulse-slow">•</span>
            <a href="#" className={`hover:text-purple-600 transition-all duration-300 hover:scale-110 font-medium ${darkMode ? 'hover:text-purple-400' : ''}`}>Confidentialité</a>
            <span className="animate-pulse-slow">•</span>
            <a href="#" className={`hover:text-purple-600 transition-all duration-300 hover:scale-110 font-medium ${darkMode ? 'hover:text-purple-400' : ''}`}>Support</a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {['📷', '🐦', '🎵', '👻'].map((emoji, index) => (
              <a
                key={index}
                href="#"
                className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-purple-50'} flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg animate-fadeInUp animation-delay-${1200 + index * 100}`}
              >
                <span className="text-xl">{emoji}</span>
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-button {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(168, 85, 247, 0);
          }
        }

        @keyframes particle-1 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0;
          }
          50% {
            transform: translate(15px, -15px);
            opacity: 1;
          }
        }

        @keyframes particle-2 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0;
          }
          50% {
            transform: translate(-15px, 15px);
            opacity: 1;
          }
        }

        @keyframes particle-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            transform: translate(8px, -8px) scale(1.5);
            opacity: 1;
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s linear infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out backwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out backwards;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out backwards;
        }

        .animate-pulse-button {
          animation: pulse-button 2s ease-in-out infinite;
        }

        .animate-particle-1 {
          animation: particle-1 3s ease-in-out infinite;
        }

        .animate-particle-2 {
          animation: particle-2 3.5s ease-in-out infinite;
        }

        .animate-particle-3 {
          animation: particle-3 4s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-700 { animation-delay: 0.7s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-900 { animation-delay: 0.9s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1100 { animation-delay: 1.1s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
        .animation-delay-1300 { animation-delay: 1.3s; }
        .animation-delay-1400 { animation-delay: 1.4s; }
      `}</style>
    </div>
  )
}
