import { useState, useEffect, useCallback, useRef } from 'react'
import cinetpayService from '../services/cinetpay.service'
import walletService from '../services/walletService'

/**
 * Hook pour vérifier le statut d'un dépôt CinetPay
 * Réplique exacte du système Formaneo (useActivationStatus)
 *
 * @param {Object} props
 * @param {string} props.transactionId - ID de la transaction CinetPay
 * @param {Function} props.onSuccess - Callback appelé en cas de succès
 * @param {Function} props.onFailure - Callback appelé en cas d'échec
 */
export const useDepositStatus = ({ transactionId, onSuccess, onFailure }) => {
  const [state, setState] = useState({
    status: 'checking', // checking, pending, completed, failed
    isLoading: true,
    error: null,
    checkCount: 0,
    depositCompleted: false,
    amount: null
  })

  const hasCompletedRef = useRef(false)

  const checkStatus = useCallback(async () => {
    if (!transactionId) {
      setState(prev => ({
        ...prev,
        status: 'failed',
        isLoading: false,
        error: 'ID de transaction manquant'
      }))
      return
    }

    // Ne pas re-vérifier si déjà complété
    if (hasCompletedRef.current) {
      return
    }

    try {
      console.log(`🔍 [DEPOSIT_STATUS] Vérification du statut (tentative ${state.checkCount + 1})`, {
        transactionId
      })

      const response = await cinetpayService.checkTransactionStatus(transactionId)

      setState(prev => ({
        ...prev,
        checkCount: prev.checkCount + 1,
        error: null
      }))

      console.log('📊 [DEPOSIT_STATUS] Réponse:', response)

      if (response.success) {
        if (response.status === 'completed') {
          // Dépôt réussi!
          console.log('✅ [DEPOSIT_STATUS] Dépôt complété avec succès!')

          hasCompletedRef.current = true

          setState(prev => ({
            ...prev,
            status: 'completed',
            isLoading: false,
            depositCompleted: true,
            amount: response.amount
          }))

          // Afficher un message de succès
          if (window.alert) {
            alert(`✅ Dépôt réussi!\n${response.amount || ''} FCFA ajoutés à votre compte.`)
          }

          // Appeler le callback de succès
          onSuccess?.()

          return
        } else if (response.status === 'failed' || response.status === 'cancelled') {
          // Dépôt échoué
          console.log('❌ [DEPOSIT_STATUS] Dépôt échoué ou annulé')

          hasCompletedRef.current = true

          setState(prev => ({
            ...prev,
            status: 'failed',
            isLoading: false,
            error: response.message || 'Le paiement a échoué'
          }))

          if (window.alert) {
            alert('❌ Le paiement a échoué ou été annulé.')
          }

          onFailure?.()
          return
        }
      }

      // Toujours en attente, continuer la vérification
      setState(prev => ({
        ...prev,
        status: 'pending'
      }))

    } catch (error) {
      console.error('❌ [DEPOSIT_STATUS] Erreur lors de la vérification:', error)

      setState(prev => ({
        ...prev,
        error: 'Erreur de vérification',
        checkCount: prev.checkCount + 1
      }))
    }
  }, [transactionId, state.checkCount, onSuccess, onFailure])

  useEffect(() => {
    if (!transactionId) return

    // Première vérification immédiate
    checkStatus()

    // Vérifier toutes les 3 secondes (comme Formaneo)
    const interval = setInterval(checkStatus, 3000)

    // Arrêter après 10 minutes (200 tentatives)
    const timeout = setTimeout(() => {
      clearInterval(interval)

      if (state.status === 'pending' || state.status === 'checking') {
        setState(prev => ({
          ...prev,
          status: 'failed',
          isLoading: false,
          error: 'Délai d\'attente dépassé'
        }))

        if (window.alert) {
          alert('⏰ Délai d\'attente dépassé. Veuillez vérifier votre compte.')
        }
      }
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [transactionId, checkStatus])

  // Arrêter le loading quand le statut final est atteint
  useEffect(() => {
    if (state.status === 'completed' || state.status === 'failed') {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [state.status])

  return state
}

export default useDepositStatus
