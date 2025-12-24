import { useState, useEffect } from 'react'
import '../styles/Wallet.css'
import walletService from '../services/walletService'
import DepositModal from '../components/wallet/DepositModal'
import TransactionHistory from '../components/wallet/TransactionHistory'
import { useDialog } from '../contexts/DialogContext'
import {
  Wallet as WalletIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Smartphone,
  CreditCard,
  X,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

export default function Wallet() {
  const { success, error: showError, warning } = useDialog()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('MTN')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [filter, setFilter] = useState('all')

  // États pour les données de l'API
  const [balance, setBalance] = useState(0)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [minWithdraw, setMinWithdraw] = useState(1000)
  const [pendingWithdrawals, setPendingWithdrawals] = useState([])
  const [withdrawing, setWithdrawing] = useState(false)

  // Chargement des données au montage du composant
  useEffect(() => {
    console.log('💰 [WALLET] Chargement des données wallet...')
    loadWalletData()
  }, [])

  // Charger les données du wallet
  const loadWalletData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📊 [WALLET] Début du chargement des données...')

      // Charger toutes les données en parallèle
      const [walletInfo, transactionsData, methodsData] = await Promise.all([
        walletService.getWalletInfo(),
        walletService.getTransactions({ perPage: 50 }),
        walletService.getWithdrawalMethods()
      ])

      console.log('✅ [WALLET] Données chargées:', {
        balance: walletInfo.wallet?.balance,
        transactionsCount: transactionsData.transactions?.length,
        methods: methodsData.methods
      })

      // Mettre à jour les états
      setBalance(walletInfo.wallet?.balance || 0)
      setStats(walletInfo.stats)
      setTransactions(transactionsData.transactions || [])
      setMinWithdraw(methodsData.minimum_amount || 1000)

      // Filtrer les retraits en attente depuis les transactions
      const withdrawalTransactions = (transactionsData.transactions || []).filter(
        t => t.type === 'withdrawal' && ['pending', 'processing'].includes(t.status)
      )
      setPendingWithdrawals(withdrawalTransactions)

      setLoading(false)
    } catch (err) {
      console.error('❌ [WALLET] Erreur lors du chargement des données:', err)
      setError('Impossible de charger les données du portefeuille')
      setLoading(false)
    }
  }

  // Gestion du changement de filtre depuis TransactionHistory
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
  }

  const handleWithdraw = async () => {
    if (withdrawing) return

    try {
      setWithdrawing(true)
      const amount = parseFloat(withdrawAmount)

      console.log('💸 [WALLET] Début du retrait:', {
        amount,
        phoneNumber,
        operator: withdrawMethod,
        balance
      })

      // Validation
      if (!amount || amount < minWithdraw) {
        warning(`Le montant minimum de retrait est de ${minWithdraw} FCFA`)
        setWithdrawing(false)
        return
      }
      if (amount % 5 !== 0) {
        warning('Le montant doit être un multiple de 5 FCFA')
        setWithdrawing(false)
        return
      }
      if (amount > balance) {
        showError('Solde insuffisant')
        setWithdrawing(false)
        return
      }
      if (!phoneNumber || phoneNumber.length < 9) {
        warning('Veuillez entrer un numéro de téléphone valide')
        setWithdrawing(false)
        return
      }

      // Formater le numéro de téléphone (sans le préfixe 237 pour CinetPay)
      let formattedPhone = phoneNumber.replace(/\D/g, '')
      if (formattedPhone.startsWith('237')) {
        formattedPhone = formattedPhone.substring(3)
      }
      console.log('📱 [WALLET] Numéro formaté:', formattedPhone)

      // Appel API CinetPay
      const response = await walletService.initiateWithdrawal(
        amount,
        formattedPhone,
        withdrawMethod // MTN, ORANGE, MOOV
      )

      console.log('✅ [WALLET] Retrait initié:', response)

      success(`Demande de retrait envoyée !\n\nMontant: ${amount} FCFA\nOpérateur: ${withdrawMethod}\nStatut: En attente de validation admin\n\nVotre demande sera traitée dans les plus brefs délais.`)

      // Fermer le modal et réinitialiser
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setPhoneNumber('')

      // Recharger les données
      loadWalletData()
    } catch (err) {
      console.error('❌ [WALLET] Erreur lors du retrait:', err)
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la demande de retrait'
      showError(errorMessage)
    } finally {
      setWithdrawing(false)
    }
  }

  // Affichage de l'état de chargement
  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-header">
          <h1>Portefeuille</h1>
        </div>
        <div className="wallet-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  // Affichage de l'état d'erreur
  if (error) {
    return (
      <div className="wallet-page">
        <div className="wallet-header">
          <h1>Portefeuille</h1>
        </div>
        <div className="wallet-container">
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-retry" onClick={loadWalletData}>
              <RefreshCw size={18} />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      {/* Header */}
      <div className="wallet-header">
        <div>
          <h1>Portefeuille</h1>
          <p>Gère ton argent facilement</p>
        </div>
      </div>

      <div className="wallet-container">
        {/* Balance Card - Compact et moderne */}
        <div className="balance-card">
          <div className="balance-top">
            <div className="balance-info-section">
              <span className="balance-label">Solde disponible</span>
              <div className="balance-amount">{balance.toLocaleString()} <span className="currency">FCFA</span></div>
            </div>
            <div className="balance-icon">
              <WalletIcon size={28} />
            </div>
          </div>

          <div className="balance-actions">
            <button className="btn-action btn-deposit" onClick={() => setShowDepositModal(true)}>
              <ArrowUpCircle size={20} />
              Recharger
            </button>
            <button className="btn-action btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
              <ArrowDownCircle size={20} />
              Retirer
            </button>
          </div>

          {/* Quick Stats intégrées - Ultra compact */}
          <div className="balance-stats">
            <div className="balance-stat-item stat-earnings">
              <TrendingUp size={14} />
              <span className="balance-stat-label">Gains</span>
              <span className="balance-stat-value">+{(stats?.total_earnings || 0).toLocaleString()}</span>
            </div>
            <div className="balance-stat-divider"></div>
            <div className="balance-stat-item stat-withdrawals">
              <TrendingDown size={14} />
              <span className="balance-stat-label">Retraits</span>
              <span className="balance-stat-value">-{(stats?.total_withdrawals || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="balance-footer">
            <span className="min-withdraw-info">Min. retrait: {minWithdraw.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Retraits en attente - Design moderne */}
        {pendingWithdrawals.length > 0 && (
          <div className="pending-section">
            <div className="section-header">
              <h3>Retraits en attente</h3>
              <span className="pending-count">{pendingWithdrawals.length}</span>
            </div>

            <div className="pending-list">
              {pendingWithdrawals.map((withdrawal) => {
                const meta = withdrawal.meta || {}
                const statusConfig = {
                  pending: { icon: Clock, color: 'warning', text: 'En attente' },
                  processing: { icon: RefreshCw, color: 'info', text: 'En cours' }
                }
                const config = statusConfig[withdrawal.status] || statusConfig.pending
                const StatusIcon = config.icon

                return (
                  <div key={withdrawal.id} className="pending-item">
                    <div className="pending-item-icon">
                      <ArrowDownCircle size={20} />
                    </div>
                    <div className="pending-item-content">
                      <div className="pending-amount">
                        {Math.abs(withdrawal.amount).toLocaleString()} FCFA
                      </div>
                      <div className="pending-details">
                        <span>{meta.operator || 'Mobile Money'}</span>
                        <span className="pending-dot">•</span>
                        <span>{meta.phone_number}</span>
                      </div>
                      <div className="pending-date">
                        {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className={`pending-status status-${config.color}`}>
                      <StatusIcon size={14} />
                      <span>{config.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pending-notice">
              <AlertCircle size={16} />
              <p>Vos demandes seront validées dans les meilleurs délais</p>
            </div>
          </div>
        )}

        {/* Transactions History */}
        <TransactionHistory
          transactions={transactions}
          filter={filter}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      </div>

      {/* Withdraw Modal - Design moderne */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Retrait Mobile Money</h3>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-balance">
                <span>Solde disponible</span>
                <span className="modal-balance-value">{balance.toLocaleString()} FCFA</span>
              </div>

              <div className="form-group">
                <label>Montant à retirer</label>
                <input
                  type="number"
                  placeholder={`Min. ${minWithdraw} FCFA`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={minWithdraw}
                  max={balance}
                />
                <span className="form-hint">Multiple de 5 FCFA</span>
              </div>

              <div className="form-group">
                <label>Opérateur Mobile Money</label>
                <div className="operator-grid">
                  <button
                    type="button"
                    className={`operator-btn ${withdrawMethod === 'MTN' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('MTN')}
                  >
                    <Smartphone size={24} />
                    <span>MTN</span>
                  </button>
                  <button
                    type="button"
                    className={`operator-btn ${withdrawMethod === 'ORANGE' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('ORANGE')}
                  >
                    <Smartphone size={24} />
                    <span>Orange</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Numéro de téléphone</label>
                <input
                  type="tel"
                  placeholder="Ex: 77 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="modal-info">
                <div className="info-item">
                  <Clock size={14} />
                  <span>Traitement en quelques heures</span>
                </div>
                <div className="info-item">
                  <CreditCard size={14} />
                  <span>Transfert gratuit via CinetPay</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
              >
                Annuler
              </button>
              <button
                className="btn-submit"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? 'Envoi...' : `Retirer ${withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : '0'} FCFA`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DepositModal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          setShowDepositModal(false)
        }}
      />
    </div>
  )
}
