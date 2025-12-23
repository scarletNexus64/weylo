import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import './InstallPWA.css';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter si l'app est déjà en mode standalone (PWA installée et lancée)
    const checkStandalone = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode);
    };

    // Détecter iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Si déjà en mode standalone, ne rien afficher
    if (isStandalone) {
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé
    const installDismissed = localStorage.getItem('installPromptDismissed');
    const installDismissedDate = localStorage.getItem('installPromptDismissedDate');

    // Si refusé il y a moins de 7 jours, ne pas afficher
    if (installDismissed && installDismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(installDismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Pour Android/Chrome - Capturer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Afficher le prompt après 3 secondes (pour ne pas être trop agressif)
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Pour iOS - Afficher le prompt personnalisé
    if (isIOS && !isStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!isIOS && deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA installée');
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
    // Pour iOS, on garde juste les instructions affichées
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
    localStorage.setItem('installPromptDismissedDate', Date.now().toString());
  };

  // Ne rien afficher si en mode standalone ou si le prompt ne doit pas être affiché
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="install-pwa-overlay">
      <div className="install-pwa-container">
        <button
          className="install-pwa-close"
          onClick={handleDismiss}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="install-pwa-icon">
          <img src="/logo.PNG" alt="Weylo" />
        </div>

        <h3 className="install-pwa-title">
          Installer Weylo
        </h3>

        <p className="install-pwa-description">
          Accède rapidement à Weylo depuis ton écran d'accueil. C'est plus rapide et plus pratique !
        </p>

        {isIOS ? (
          <div className="install-pwa-ios-instructions">
            <div className="install-pwa-step">
              <div className="install-pwa-step-number">1</div>
              <div className="install-pwa-step-content">
                <p>Appuie sur le bouton <strong>Partager</strong></p>
                <Share size={24} className="install-pwa-step-icon" />
              </div>
            </div>

            <div className="install-pwa-step">
              <div className="install-pwa-step-number">2</div>
              <div className="install-pwa-step-content">
                <p>Puis sur <strong>"Sur l'écran d'accueil"</strong></p>
                <Plus size={24} className="install-pwa-step-icon" />
              </div>
            </div>

            <button
              className="install-pwa-button secondary"
              onClick={handleDismiss}
            >
              J'ai compris
            </button>
          </div>
        ) : (
          <div className="install-pwa-actions">
            <button
              className="install-pwa-button primary"
              onClick={handleInstallClick}
            >
              <Download size={20} />
              Installer l'application
            </button>

            <button
              className="install-pwa-button secondary"
              onClick={handleDismiss}
            >
              Plus tard
            </button>
          </div>
        )}

        <div className="install-pwa-benefits">
          <div className="install-pwa-benefit">
            <span className="install-pwa-benefit-icon">⚡</span>
            <span>Accès instantané</span>
          </div>
          <div className="install-pwa-benefit">
            <span className="install-pwa-benefit-icon">📱</span>
            <span>Expérience native</span>
          </div>
          <div className="install-pwa-benefit">
            <span className="install-pwa-benefit-icon">🔔</span>
            <span>Notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
