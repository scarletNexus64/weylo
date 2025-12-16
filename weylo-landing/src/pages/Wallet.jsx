import { useState } from 'react'
import '../styles/Wallet.css'

export default function Wallet() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [filter, setFilter] = useState('all')

  const balance = 15750
  const minWithdraw = 1000

  const transactions = [
    { id: 1, type: 'credit', amount: 5000, description: 'Cadeau reçu: Diamant 💎', from: 'Anonyme', date: 'Il y a 2h', status: 'completed' },
    { id: 2, type: 'debit', amount: 2000, description: 'Cadeau envoyé: Étoile ⭐', to: 'Aminata K.', date: 'Il y a 5h', status: 'completed' },
    { id: 3, type: 'credit', amount: 10000, description: 'Recharge de portefeuille', method: 'MTN Mobile Money', date: 'Hier', status: 'completed' },
    { id: 4, type: 'debit', amount: 5000, description: 'Retrait Mobile Money', method: 'MTN', date: 'Il y a 2 jours', status: 'completed' },
    { id: 5, type: 'credit', amount: 250, description: 'Cadeau reçu: Champagne 🍾', from: 'Ibrahim M.', date: 'Il y a 3 jours', status: 'completed' },
    { id: 6, type: 'debit', amount: 450, description: 'Abonnement Premium', date: 'Il y a 5 jours', status: 'completed' },
    { id: 7, type: 'credit', amount: 1500, description: 'Cadeau reçu: Fusée 🚀', from: 'Fatou D.', date: 'Il y a 1 semaine', status: 'completed' },
    { id: 8, type: 'debit', amount: 3000, description: 'Retrait Mobile Money', method: 'Orange Money', date: 'Il y a 1 semaine', status: 'pending' }
  ]

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'credit') return t.type === 'credit'
    if (filter === 'debit') return t.type === 'debit'
    return true
  })

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < minWithdraw) {
      alert(`Le montant minimum de retrait est de ${minWithdraw} FCFA`)
      return
    }
    if (amount > balance) {
      alert('Solde insuffisant')
      return
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      alert('Veuillez entrer un numéro de téléphone valide')
      return
    }
    alert(`Demande de retrait de ${amount} FCFA via ${withdrawMethod === 'mtn' ? 'MTN' : 'Orange'} Money envoyée !`)
    setShowWithdrawModal(false)
    setWithdrawAmount('')
    setPhoneNumber('')
  }

  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>Portefeuille 💰</h1>
        <p>Gère ton argent, reçois et retire tes gains facilement</p>
      </div>

      <div className="wallet-content">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-header">
            <h3>Solde disponible</h3>
            <span className="balance-icon">💳</span>
          </div>
          <div className="balance-amount">{balance.toLocaleString()} FCFA</div>
          <div className="balance-actions">
            <button className="btn-topup" onClick={() => setShowTopUpModal(true)}>
              ⬆️ Recharger
            </button>
            <button className="btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
              ⬇️ Retirer
            </button>
          </div>
          <div className="balance-info">
            <span>Minimum retrait: {minWithdraw.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-icon green">⬆️</div>
            <div className="stat-details">
              <div className="stat-label">Gains totaux</div>
              <div className="stat-value green">
                +{transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon red">⬇️</div>
            <div className="stat-details">
              <div className="stat-label">Dépenses totales</div>
              <div className="stat-value red">
                -{transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="transactions-section">
          <div className="transactions-header">
            <h3>Historique des transactions</h3>
            <div className="transaction-filters">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                Toutes
              </button>
              <button className={filter === 'credit' ? 'active' : ''} onClick={() => setFilter('credit')}>
                Reçus
              </button>
              <button className={filter === 'debit' ? 'active' : ''} onClick={() => setFilter('debit')}>
                Envoyés
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className={`transaction-icon ${transaction.type}`}>
                  {transaction.type === 'credit' ? '⬆️' : '⬇️'}
                </div>
                <div className="transaction-details">
                  <h4>{transaction.description}</h4>
                  <div className="transaction-meta">
                    {transaction.from && <span>De: {transaction.from}</span>}
                    {transaction.to && <span>À: {transaction.to}</span>}
                    {transaction.method && <span>Via: {transaction.method}</span>}
                    <span className="transaction-date">{transaction.date}</span>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} FCFA
                </div>
                <div className={`transaction-status ${transaction.status}`}>
                  {transaction.status === 'completed' ? '✓' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Retrait Mobile Money</h3>
              <button className="btn-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
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
                <label>Moyen de retrait</label>
                <div className="payment-methods">
                  <div
                    className={`payment-method ${withdrawMethod === 'mtn' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('mtn')}
                  >
                    <div className="method-icon">📱</div>
                    <div className="method-name">MTN Mobile Money</div>
                  </div>
                  <div
                    className={`payment-method ${withdrawMethod === 'orange' ? 'active' : ''}`}
                    onClick={() => setWithdrawMethod('orange')}
                  >
                    <div className="method-icon">📲</div>
                    <div className="method-name">Orange Money</div>
                  </div>
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
                <p>⏱️ Les retraits sont traités sous 24-48h ouvrées</p>
                <p>💳 Des frais de traitement peuvent s'appliquer</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowWithdrawModal(false)}>
                Annuler
              </button>
              <button className="btn-submit" onClick={handleWithdraw}>
                Retirer {withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : '0'} FCFA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recharger le portefeuille</h3>
              <button className="btn-close" onClick={() => setShowTopUpModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="topup-amounts">
                <button className="amount-btn">1 000 FCFA</button>
                <button className="amount-btn">2 500 FCFA</button>
                <button className="amount-btn">5 000 FCFA</button>
                <button className="amount-btn">10 000 FCFA</button>
                <button className="amount-btn">25 000 FCFA</button>
                <button className="amount-btn">50 000 FCFA</button>
              </div>

              <div className="form-group">
                <label>Ou montant personnalisé</label>
                <input type="number" placeholder="Montant en FCFA" />
              </div>

              <div className="form-group">
                <label>Moyen de paiement</label>
                <div className="payment-methods">
                  <div className="payment-method active">
                    <div className="method-icon">📱</div>
                    <div className="method-name">MTN Mobile Money</div>
                  </div>
                  <div className="payment-method">
                    <div className="method-icon">📲</div>
                    <div className="method-name">Orange Money</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTopUpModal(false)}>
                Annuler
              </button>
              <button className="btn-submit">
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
