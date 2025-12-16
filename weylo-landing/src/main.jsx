import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'
import App from './App.jsx'
import SendMessagePage from './pages/SendMessagePage.jsx'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Confessions from './pages/Confessions'
import Chat from './pages/Chat'
import Gifts from './pages/Gifts'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

// Public Route (redirect if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  return isAuthenticated === false ? children : <Navigate to="/dashboard" replace />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <App />
              </PublicRoute>
            }
          />
          <Route path="/m/:userId" element={<SendMessagePage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="messages" element={<Messages />} />
            <Route path="confessions" element={<Confessions />} />
            <Route path="chat" element={<Chat />} />
            <Route path="gifts" element={<Gifts />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>🚧 Paramètres - En cours de construction</div>} />
            <Route path="notifications" element={<div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>🚧 Notifications - En cours de construction</div>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
