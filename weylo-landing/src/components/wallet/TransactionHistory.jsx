import React from 'react'
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
  AlertCircle
} from 'lucide-react'

/**
 * Composant pour afficher l'historique des transactions du wallet
 */
const TransactionHistory = ({ transactions = [], filter = 'all', onFilterChange, loading = false }) => {

  // Filtrer les transactions selon le filtre actif
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'credit') return t.type === 'credit' || t.amount > 0
    if (filter === 'debit') return t.type === 'debit' || t.amount < 0
    if (filter === 'deposit') return t.type === 'deposit' || t.description?.toLowerCase().includes('dépôt')
    if (filter === 'withdrawal') return t.type === 'withdrawal' || t.description?.toLowerCase().includes('retrait')
    return true
  })

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
      return <Download size={20} className="text-green-600" />
    }
    if (type === 'withdrawal' || description.includes('retrait')) {
      return <Upload size={20} className="text-red-600" />
    }
    if (description.includes('cadeau') || description.includes('gift')) {
      return <Gift size={20} className="text-pink-600" />
    }
    if (description.includes('paiement')) {
      return <CreditCard size={20} className="text-blue-600" />
    }

    // Sinon, basé sur le montant
    return transaction.amount > 0
      ? <ArrowUpRight size={20} className="text-green-600" />
      : <ArrowDownLeft size={20} className="text-red-600" />
  }

  // Obtenir le badge de statut
  const getStatusBadge = (transaction) => {
    const status = transaction.status?.toLowerCase() || 'completed'

    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'En attente',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      },
      processing: {
        icon: RefreshCw,
        text: 'En cours',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      completed: {
        icon: Check,
        text: 'Complété',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      failed: {
        icon: XCircle,
        text: 'Échoué',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      },
      cancelled: {
        icon: X,
        text: 'Annulé',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200'
      }
    }

    const config = statusConfig[status] || statusConfig.completed
    const StatusIcon = config.icon

    return (
      <div className={`flex items-center gap-1 ${config.textColor} ${config.bgColor} border ${config.borderColor} px-2 py-1 rounded-full`}>
        <StatusIcon size={14} className={status === 'processing' ? 'animate-spin' : ''} />
        <span className="text-xs font-medium">{config.text}</span>
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
        <div className="flex items-center gap-2 mt-1">
          {phone && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {operator} - {phone}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatDate(transaction.created_at)}
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 mt-1">
        {transaction.reference && (
          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
            Réf: {transaction.reference.slice(0, 12)}...
          </span>
        )}
        <span className="text-xs text-gray-500">
          {formatDate(transaction.created_at)}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="transactions-section">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange?.('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => onFilterChange?.('deposit')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'deposit'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Dépôts
          </button>
          <button
            onClick={() => onFilterChange?.('withdrawal')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'withdrawal'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Retraits
          </button>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Wallet size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">Aucune transaction</p>
            <p className="text-gray-500 text-sm mt-1">
              Vos transactions apparaîtront ici
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Icône */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                transaction.amount > 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {getTransactionIcon(transaction)}
              </div>

              {/* Détails */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {transaction.description || 'Transaction'}
                </p>
                {getTransactionDetails(transaction)}
              </div>

              {/* Montant */}
              <div className="flex-shrink-0 text-right">
                <p className={`font-semibold text-lg ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.formatted_amount ||
                    `${transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()} FCFA`
                  }
                </p>
                <div className="mt-1">
                  {getStatusBadge(transaction)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer avec pagination si nécessaire */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
