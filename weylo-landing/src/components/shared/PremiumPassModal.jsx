import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Sparkles, Shield, Eye, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import premiumPassService from '../../services/premiumPassService';
import settingsService from '../../services/settingsService';
import PremiumBadge from './PremiumBadge';
import './PremiumPassModal.css';

const PremiumPassModal = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const { refreshUser } = useAuth();
  const [premiumInfo, setPremiumInfo] = useState(null);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [appSettings, setAppSettings] = useState({
    premium_monthly_price: 5000,
    currency: 'FCFA'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPremiumData();
    }
  }, [isOpen]);

  const loadPremiumData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [info, status, settings] = await Promise.all([
        premiumPassService.getInfo(),
        premiumPassService.getStatus(),
        settingsService.getPublicSettings()
      ]);

      setPremiumInfo(info);
      setPremiumStatus(status);
      setAutoRenew(status.auto_renew || false);

      // Charger les settings avec le prix dynamique
      if (settings) {
        setAppSettings({
          premium_monthly_price: settings.premium_monthly_price || 5000,
          currency: settings.currency || 'FCFA'
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données premium:', err);
      setError('Impossible de charger les informations');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const response = await premiumPassService.purchase(autoRenew);

      if (response.success) {
        setSuccess(response.message);

        // ✅ IMPORTANT: Rafraîchir l'utilisateur dans le contexte global
        await refreshUser();

        // Recharger les données du modal
        await loadPremiumData();

        // Appeler le callback de succès
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Fermer le modal après 2 secondes
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Erreur lors de l\'achat du passe premium:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'achat du passe premium');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!premiumStatus?.is_premium) {
      // Si pas encore premium, juste toggle localement
      setAutoRenew(!autoRenew);
      return;
    }

    // Si déjà premium, mettre à jour sur le serveur
    setIsProcessing(true);
    try {
      if (premiumStatus.auto_renew) {
        await premiumPassService.disableAutoRenew();
      } else {
        await premiumPassService.enableAutoRenew();
      }
      await loadPremiumData();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du renouvellement auto:', err);
      setError('Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header avec gradient */}
        <div className="premium-modal-header">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Passe Premium
              <PremiumBadge size="medium" showTooltip={false} />
            </h2>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Content */}
        {!isLoading && premiumInfo && premiumStatus && (
          <>
            {/* Status actuel */}
            {premiumStatus.is_premium && (
              <div className="p-4 m-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                  <Check className="w-5 h-5" />
                  <span>Vous êtes Premium !</span>
                </div>
                <p className="text-sm text-green-700">
                  Expire dans {premiumStatus.days_remaining} jours
                  {premiumStatus.auto_renew && " (renouvellement automatique activé)"}
                </p>
              </div>
            )}

            {/* Prix */}
            <div className="p-6 border-b border-gray-200">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {appSettings.premium_monthly_price?.toLocaleString()} {appSettings.currency}
                </div>
                <div className="text-sm text-gray-600">
                  par mois
                </div>
                {currentUser && (
                  <div className="mt-3 text-sm text-gray-600">
                    Solde actuel: <span className="font-semibold">{currentUser.wallet_balance?.toLocaleString()} {appSettings.currency}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Avantages Premium
              </h3>
              <ul className="space-y-3">
                {premiumInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Renouvellement automatique */}
            <div className="p-6 border-b border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Renouvellement automatique</div>
                  <div className="text-sm text-gray-600">
                    Votre passe sera renouvelé automatiquement chaque mois
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={premiumStatus.is_premium ? premiumStatus.auto_renew : autoRenew}
                    onChange={handleToggleAutoRenew}
                    disabled={isProcessing}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    (premiumStatus.is_premium ? premiumStatus.auto_renew : autoRenew)
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      (premiumStatus.is_premium ? premiumStatus.auto_renew : autoRenew)
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="p-6">
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Traitement...</span>
                  </>
                ) : premiumStatus.is_premium ? (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Renouveler maintenant</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Devenir Premium</span>
                  </>
                )}
              </button>

              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 py-2 transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PremiumPassModal;
