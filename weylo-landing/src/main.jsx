import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SendMessagePage from './pages/SendMessagePage.jsx'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import ReplyAnonymous from './pages/ReplyAnonymous'
import Confessions from './pages/Confessions'
import ConversationsList from './pages/ConversationsList'
import ChatConversation from './pages/ChatConversation'
import Groups from './pages/Groups'
import GroupChat from './pages/GroupChat'
import JoinGroup from './pages/JoinGroup'
import Gifts from './pages/Gifts'
import Wallet from './pages/Wallet'
import PaymentReturnPage from './pages/PaymentReturnPage'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

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

// Admin Route (only for admins)
function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator'

  return isAdmin ? children : <Navigate to="/dashboard" replace />
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
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route path="/m/:userId" element={<SendMessagePage />} />
          <Route path="/u/:username" element={<SendMessagePage />} />

          {/* Group Join Routes (can be accessed without full authentication) */}
          <Route path="/groups/join/:inviteCode" element={<JoinGroup />} />

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
            <Route path="reply-anonymous/:messageId" element={<ReplyAnonymous />} />
            <Route path="confessions" element={<Confessions />} />
            <Route path="chat" element={<ConversationsList />} />
            <Route path="chat/:conversationId" element={<ChatConversation />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:groupId" element={<GroupChat />} />
            <Route path="gifts" element={<Gifts />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="wallet/deposit/return" element={<PaymentReturnPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>🚧 Paramètres - En cours de construction</div>} />
            <Route path="notifications" element={<div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>🚧 Notifications - En cours de construction</div>} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
