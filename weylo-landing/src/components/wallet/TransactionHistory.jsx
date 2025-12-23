import React, { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Clock,
  X,
  Download,
  Upload,
  Gift,
  CreditCard,
  Wallet,
  RefreshCw,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

/**
 * Composant pour afficher l'historique des transactions du wallet
 */
const TransactionHistory = ({ transactions = [], filter = 'all', onFilterChange, loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Limiter à 5 transactions par page

  // Filtrer les transactions selon le filtre actif
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'credit') return t.type === 'credit' || t.amount > 0
    if (filter === 'debit') return t.type === 'debit' || t.amount < 0
    if (filter === 'deposit') return t.type === 'deposit' || t.description?.toLowerCase().includes('dépôt')
    if (filter === 'withdrawal') return t.type === 'withdrawal' || t.description?.toLowerCase().includes('retrait')
    return true
  })

  // Calculer la pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Réinitialiser à la page 1 quand le filtre change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Scroll vers le haut de la liste lors du changement de page
  React.useEffect(() => {
    if (currentPage > 1) {
      const transactionSection = document.querySelector('.transactions-section')
      if (transactionSection) {
        const yOffset = -80 // Offset pour ne pas cacher sous le header
        const y = transactionSection.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }
  }, [currentPage])

  // S'assurer que les transactions sont visibles au premier chargement sur mobile
  React.useEffect(() => {
    const checkVisibility = () => {
      const transactionList = document.querySelector('.transaction-list')
      if (transactionList && window.innerWidth <= 768) {
        const rect = transactionList.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Si la liste des transactions est cachée ou partiellement visible
        if (rect.top > windowHeight - 100) {
          // Scroll doucement pour montrer les transactions
          setTimeout(() => {
            transactionList.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest'
            })
          }, 300)
        }
      }
    }

    // Vérifier après le chargement initial
    checkVisibility()
  }, [transactions])

  // Formater la date de façon relative
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return "À l'instant"
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInDays === 1) return "Hier"
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
    }
    return date.toLocaleDateString('fr-FR')
  }

  // Obtenir l'icône selon le type de transaction
  const getTransactionIcon = (transaction) => {
    const type = transaction.type?.toLowerCase() || ''
    const description = transaction.description?.toLowerCase() || ''

    // Vérifier d'abord le type explicite
    if (type === 'deposit' || description.includes('dépôt') || description.includes('depot')) {
      return <Download size={20} style={{ color: '#10b981' }} />
    }
    if (type === 'withdrawal' || description.includes('retrait')) {
      return <Upload size={20} style={{ color: '#ef4444' }} />
    }
    if (description.includes('cadeau') || description.includes('gift')) {
      return <Gift size={20} style={{ color: '#ec4899' }} />
    }
    if (description.includes('paiement')) {
      return <CreditCard size={20} style={{ color: '#3b82f6' }} />
    }

    // Sinon, basé sur le montant
    return transaction.amount > 0
      ? <ArrowUpRight size={20} style={{ color: '#10b981' }} />
      : <ArrowDownLeft size={20} style={{ color: '#ef4444' }} />
  }

  // Obtenir le badge de statut
  const getStatusBadge = (transaction) => {
    const status = transaction.status?.toLowerCase() || 'completed'

    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'En attente',
        className: 'status-pending'
      },
      processing: {
        icon: RefreshCw,
        text: 'En cours',
        className: 'status-processing'
      },
      completed: {
        icon: Check,
        text: 'Complété',
        className: 'status-completed'
      },
      failed: {
        icon: XCircle,
        text: 'Échoué',
        className: 'status-failed'
      },
      cancelled: {
        icon: X,
        text: 'Annulé',
        className: 'status-cancelled'
      }
    }

    const config = statusConfig[status] || statusConfig.completed
    const StatusIcon = config.icon

    return (
      <div className={`transaction-status-badge ${config.className}`}>
        <StatusIcon size={14} className={status === 'processing' ? 'animate-spin' : ''} />
        <span>{config.text}</span>
      </div>
    )
  }

  // Obtenir les informations supplémentaires (métadonnées)
  const getTransactionDetails = (transaction) => {
    if (transaction.type === 'withdrawal') {
      const meta = transaction.meta || {}
      const operator = meta.operator || 'Mobile Money'
      const phone = meta.phone_number || ''

      return (
        <div className="transaction-meta">
          {phone && (
            <span className="transaction-meta-badge">
              {operator} - {phone}
            </span>
          )}
          <span className="transaction-time">
            {formatDate(transaction.created_at)}
          </span>
        </div>
      )
    }

    return (
      <div className="transaction-meta">
        {transaction.reference && (
          <span className="transaction-meta-badge">
            Réf: {transaction.reference.slice(0, 12)}...
          </span>
        )}
        <span className="transaction-time">
          {formatDate(transaction.created_at)}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="transaction-loading">
        <div className="transaction-loading-spinner"></div>
        <span>Chargement...</span>
      </div>
    )
  }

  return (
    <div className="transactions-section">
      {/* Header avec filtres */}
      <div className="transaction-filters">
        <h3>Historique</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange?.('all')}
            className={`transaction-filter-btn ${filter === 'all' ? 'active-all' : ''}`}
          >
            Toutes
          </button>
          <button
            onClick={() => onFilterChange?.('deposit')}
            className={`transaction-filter-btn ${filter === 'deposit' ? 'active-green' : ''}`}
          >
            Dépôts
          </button>
          <button
            onClick={() => onFilterChange?.('withdrawal')}
            className={`transaction-filter-btn ${filter === 'withdrawal' ? 'active-red' : ''}`}
          >
            Retraits
          </button>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="transaction-list">
        {filteredTransactions.length === 0 ? (
          <div className="transaction-empty">
            <Wallet size={48} />
            <p>Aucune transaction</p>
            <p className="subtitle">
              Vos transactions apparaîtront ici
            </p>
          </div>
        ) : (
          paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              {/* Icône */}
              <div className={`transaction-icon-wrapper ${transaction.amount > 0 ? 'credit' : 'debit'}`}>
                {getTransactionIcon(transaction)}
              </div>

              {/* Détails */}
              <div className="transaction-details">
                <p className="transaction-description">
                  {transaction.description || 'Transaction'}
                </p>
                {getTransactionDetails(transaction)}
              </div>

              {/* Montant */}
              <div className="transaction-amount-section">
                <p className={`transaction-amount ${transaction.amount > 0 ? 'credit' : 'debit'}`}>
                  {transaction.formatted_amount ||
                    `${transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()} FCFA`
                  }
                </p>
                {getStatusBadge(transaction)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="transaction-pagination">
          <div className="pagination-info">
            Affichage {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} sur {filteredTransactions.length} transactions
          </div>
          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
