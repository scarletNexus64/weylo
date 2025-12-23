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
  CheckCircle,
  XCircle,
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
        <div className="page-header">
          <h1>Portefeuille 💰</h1>
          <p>Chargement des données...</p>
        </div>
        <div className="wallet-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  // Affichage de l'état d'erreur
  if (error) {
    return (
      <div className="wallet-page">
        <div className="page-header">
          <h1>Portefeuille 💰</h1>
          <p>Une erreur est survenue</p>
        </div>
        <div className="wallet-content">
          <div className="error-message">
            <p>{error}</p>
            <button className="btn-retry" onClick={loadWalletData}>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>Portefeuille</h1>
        <p>Gère ton argent, reçois et retire tes gains facilement</p>
      </div>

      <div className="wallet-content">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <h3>Solde disponible</h3>
            <span className="balance-icon">
              <WalletIcon size={32} />
            </span>
          </div>
          <div className="balance-amount">{balance.toLocaleString()} FCFA</div>
          <div className="balance-actions">
            <button className="btn-topup" onClick={() => setShowDepositModal(true)}>
              <ArrowUpCircle size={18} />
              <span>Recharger</span>
            </button>
            <button className="btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
              <ArrowDownCircle size={18} />
              <span>Retirer</span>
            </button>
          </div>
          <div className="balance-info">
            <span>Minimum retrait: {minWithdraw.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-label">Gains totaux</div>
              <div className="stat-value green">
                +{(stats?.total_earnings || 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon red">
              <TrendingDown size={24} />
            </div>
            <div className="stat-details">
              <div className="stat-label">Dépenses totales</div>
              <div className="stat-value red">
                -{(stats?.total_withdrawals || 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </div>

        {/* Retraits en attente */}
        {pendingWithdrawals.length > 0 && (
          <div className="pending-withdrawals-section">
            <div className="section-header">
              <h3>Retraits en attente de validation</h3>
              <span className="badge-count">{pendingWithdrawals.length}</span>
            </div>
            <div className="pending-list">
              {pendingWithdrawals.map((withdrawal) => {
                const meta = withdrawal.meta || {}
                const statusConfig = {
                  pending: { icon: Clock, color: 'orange', text: 'En attente admin' },
                  processing: { icon: RefreshCw, color: 'blue', text: 'En cours de transfert' }
                }
                const config = statusConfig[withdrawal.status] || statusConfig.pending
                const StatusIcon = config.icon

                return (
                  <div key={withdrawal.id} className="pending-withdrawal-item">
                    <div className="withdrawal-icon">
                      <ArrowDownCircle size={24} />
                    </div>
                    <div className="withdrawal-details">
                      <div className="withdrawal-amount">
                        {Math.abs(withdrawal.amount).toLocaleString()} FCFA
                      </div>
                      <div className="withdrawal-info">
                        <span>{meta.operator || 'Mobile Money'} - {meta.phone_number}</span>
                        <span className="withdrawal-date">
                          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`withdrawal-status status-${config.color}`}>
                      <StatusIcon size={16} />
                      <span>{config.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pending-info">
              <AlertCircle size={16} />
              <p>Vos demandes de retrait sont en cours de validation par l'administrateur. Vous serez notifié une fois le transfert effectué.</p>
            </div>
          </div>
        )}

        {/* Transactions - Nouveau composant */}
        <TransactionHistory
          transactions={transactions}
          filter={filter}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Retrait Mobile Money</h3>
              <button className="btn-close" onClick={() => setShowWithdrawModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="balance-info-modal">
                <span>Solde disponible:</span>
                <span className="balance-value">{balance.toLocaleString()} FCFA</span>
              </div>

              <div className="form-group">
                <label>Montant à retirer</label>
                <input
                  type="number"
                  placeholder={`Minimum ${minWithdraw} FCFA`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={minWithdraw}
                  max={balance}
                />
                <span className="input-hint">Minimum: {minWithdraw.toLocaleString()} FCFA</span>
              </div>

              <div className="form-group">
                <label>Opérateur Mobile Money</label>
                <div className="payment-methods">
                  <div
                    className={`payment-method ${withdrawMethod === 'MTN' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('MTN')}
                  >
                    <div className="method-icon">
                      <Smartphone size={28} />
                    </div>
                    <div className="method-name">MTN Mobile Money</div>
                  </div>
                  <div
                    className={`payment-method ${withdrawMethod === 'ORANGE' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('ORANGE')}
                  >
                    <div className="method-icon">
                      <Smartphone size={28} />
                    </div>
                    <div className="method-name">Orange Money</div>
                  </div>
                  {/* <div
                    className={`payment-method ${withdrawMethod === 'MOOV' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('MOOV')}
                  >
                    <div className="method-icon">
                      <Smartphone size={28} />
                    </div>
                    <div className="method-name">Moov Money</div>
                  </div> */}
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

              <div className="withdrawal-info">
                <p className="info-item">
                  <AlertCircle size={14} />
                  <span>Votre demande sera validée manuellement par l'administrateur</span>
                </p>
                <p className="info-item">
                  <Clock size={14} />
                  <span>Les retraits sont généralement traités en quelques heures</span>
                </p>
                <p className="info-item">
                  <CreditCard size={14} />
                  <span>Transfert gratuit via CinetPay</span>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowWithdrawModal(false)} disabled={withdrawing}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleWithdraw} disabled={withdrawing}>
                {withdrawing ? 'Envoi en cours...' : `Retirer ${withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : '0'} FCFA`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DepositModal - CinetPay Integration (Formaneo System) */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          setShowDepositModal(false)
          // Le rechargement se fera automatiquement après le retour de la page payment
        }}
      />
    </div>
  )
}
