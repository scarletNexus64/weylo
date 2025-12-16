import { useState, useEffect } from 'react'
import AuthModal from './components/auth/AuthModal'

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCookieBanner, setShowCookieBanner] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [darkMode, setDarkMode] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)

    // Check if cookies already accepted
    const cookiesAccepted = localStorage.getItem('cookiesAccepted')
    if (cookiesAccepted) {
      setShowCookieBanner(false)
    }

    // Check if dark mode was previously set
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark-mode')
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setShowCookieBanner(false)
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())

    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="App">
      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="cookie-banner">
          <div className="cookie-content">
            <span className="cookie-icon">🍪</span>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre{' '}
              <a href="#privacy">politique de confidentialité</a>.
            </p>
            <div className="cookie-buttons">
              <button className="btn-cookie-accept" onClick={acceptCookies}>
                Accepter
              </button>
              <button className="btn-cookie-decline" onClick={() => setShowCookieBanner(false)}>
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="logo" onClick={() => scrollToSection('home')}>
            <img src="/logo.PNG" alt="Weylo Logo" className="logo-image" />
            <span>Weylo</span>
          </div>

          {/* Desktop Menu */}
          <ul className="nav-links">
            <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Fonctionnalités</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>Comment ça marche</a></li>
            <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Tarifs</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>À propos</a></li>
          </ul>

          <div className="nav-auth">
            <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
              Connexion
            </button>
            <button className="btn-register" onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}>
              Inscription
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Fonctionnalités</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>Comment ça marche</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Tarifs</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>FAQ</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>À propos</a>
            <div className="mobile-auth">
              <button className="theme-toggle mobile" onClick={toggleDarkMode}>
                {darkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
              </button>
              <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}>
                Connexion
              </button>
              <button className="btn-register" onClick={() => { setAuthMode('register'); setShowAuthModal(true); setMobileMenuOpen(false); }}>
                Inscription
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content fade-in-up">
          <div className="hero-text">
            <h1>
              Reçois des <span className="gradient-text">messages secrets</span> de façon anonyme
            </h1>
            <p>
              Partage ton lien Weylo sur Instagram, Snapchat ou TikTok et laisse tes amis t'envoyer des messages, questions ou aveux en toute confidentialité.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Commencer gratuitement</button>
              <button className="btn-secondary">En savoir plus</button>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500K+</div>
                <div className="stat-label">Utilisateurs actifs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10M+</div>
                <div className="stat-label">Messages envoyés</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.8/5</div>
                <div className="stat-label">Note moyenne</div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="phone-mockup float">
              <img src="/logo.PNG" alt="Weylo" className="hero-logo-float" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-container">
          <h2 className="section-title">Comment <span className="gradient-text">ça marche</span> ?</h2>
          <p className="section-subtitle">
            Commence à recevoir des messages anonymes en 3 étapes simples
          </p>

          <div className="steps-grid">
            <div className="step-card fade-in-up">
              <div className="step-number">1</div>
              <div className="step-icon">📱</div>
              <h3>Crée ton compte</h3>
              <p>
                Inscris-toi gratuitement en quelques secondes. Choisis ton nom d'utilisateur unique et personnalise ton profil.
              </p>
            </div>

            <div className="step-card fade-in-up">
              <div className="step-number">2</div>
              <div className="step-icon">🔗</div>
              <h3>Partage ton lien</h3>
              <p>
                Copie ton lien Weylo et partage-le sur tes réseaux sociaux : Instagram, Snapchat, TikTok, WhatsApp...
              </p>
            </div>

            <div className="step-card fade-in-up">
              <div className="step-number">3</div>
              <div className="step-icon">💌</div>
              <h3>Reçois des messages</h3>
              <p>
                Tes amis t'envoient des messages anonymes. Réponds, partage ou découvre qui t'a écrit avec Premium !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="features-container">
          <h2 className="section-title">Pourquoi choisir <span className="gradient-text">Weylo</span> ?</h2>
          <p className="section-subtitle">
            Découvre une nouvelle façon de communiquer avec tes amis de manière anonyme et sécurisée
          </p>

          <div className="features-grid">
            <div className="feature-card fade-in-up">
              <span className="feature-icon">🎭</span>
              <h3>100% Anonyme</h3>
              <p>
                Reçois des messages totalement anonymes. L'identité de l'expéditeur reste secrète, sauf si tu paies pour la révéler.
              </p>
            </div>

            <div className="feature-card fade-in-up">
              <span className="feature-icon">💬</span>
              <h3>Chat en temps réel</h3>
              <p>
                Discute instantanément avec tes amis grâce à notre système de messagerie en temps réel. Système de flammes pour suivre tes streaks !
              </p>
            </div>

            <div className="feature-card fade-in-up">
              <span className="feature-icon">📢</span>
              <h3>Confessions publiques</h3>
              <p>
                Partage ou reçois des confessions anonymes dans un fil public. Aime et découvre ce que les autres pensent vraiment.
              </p>
            </div>

            <div className="feature-card fade-in-up">
              <span className="feature-icon">🔓</span>
              <h3>Révélation d'identité</h3>
              <p>
                Envie de savoir qui t'a écrit ? Abonne-toi au Premium pour 450 FCFA/mois et découvre l'identité de l'expéditeur.
              </p>
            </div>

            <div className="feature-card fade-in-up">
              <span className="feature-icon">🎁</span>
              <h3>Système de cadeaux</h3>
              <p>
                Envoie des cadeaux virtuels à tes amis (Bronze, Silver, Gold, Diamond). Les destinataires gagnent de l'argent réel !
              </p>
            </div>

            <div className="feature-card fade-in-up">
              <span className="feature-icon">💰</span>
              <h3>Gagne de l'argent</h3>
              <p>
                Reçois des cadeaux et convertis-les en argent réel. Retire facilement via MTN Mobile Money ou Orange Money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="testimonials-container">
          <h2 className="section-title">Ce que disent nos <span className="gradient-text">utilisateurs</span></h2>
          <p className="section-subtitle">
            Rejoins des milliers de jeunes qui adorent Weylo
          </p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Weylo est incroyable ! J'ai reçu tellement de messages intéressants et j'adore le mystère de ne pas savoir qui m'écrit."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩</div>
                <div className="author-info">
                  <div className="author-name">Aminata K.</div>
                  <div className="author-location">Dakar, Sénégal</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Le système de cadeaux est génial ! J'ai déjà gagné plus de 50 000 FCFA grâce aux cadeaux que je reçois."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨</div>
                <div className="author-info">
                  <div className="author-name">Ibrahim M.</div>
                  <div className="author-location">Abidjan, Côte d'Ivoire</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "L'application est super bien faite, facile à utiliser et le Premium vaut vraiment le coup pour découvrir qui nous écrit !"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👧</div>
                <div className="author-info">
                  <div className="author-name">Fatou D.</div>
                  <div className="author-location">Bamako, Mali</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="pricing-container">
          <h2 className="section-title">Des <span className="gradient-text">tarifs simples</span></h2>
          <p className="section-subtitle">
            Commence gratuitement, passe au Premium quand tu veux découvrir qui t'écrit
          </p>

          <div className="pricing-cards">
            <div className="pricing-card">
              <span className="pricing-tag">Gratuit</span>
              <h3>Basic</h3>
              <div className="pricing-price">0 FCFA</div>
              <div className="pricing-period">Pour toujours</div>
              <ul className="pricing-features">
                <li>Messages anonymes illimités</li>
                <li>Envoi de messages</li>
                <li>Profil public</li>
                <li>Chat en temps réel</li>
                <li>Voir les confessions publiques</li>
              </ul>
              <button className="pricing-button">C'est parti !</button>
            </div>

            <div className="pricing-card featured">
              <span className="pricing-tag">Populaire</span>
              <h3>Premium</h3>
              <div className="pricing-price">450 FCFA</div>
              <div className="pricing-period">Par mois</div>
              <ul className="pricing-features">
                <li>Tout du plan gratuit</li>
                <li>Révélation d'identité</li>
                <li>Voir qui t'a envoyé des messages</li>
                <li>Badge Premium exclusif</li>
                <li>Support prioritaire</li>
                <li>Statistiques avancées</li>
              </ul>
              <button className="pricing-button">Devenir Premium</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="faq-container">
          <h2 className="section-title">Questions <span className="gradient-text">fréquentes</span></h2>
          <p className="section-subtitle">
            Tout ce que tu dois savoir sur Weylo
          </p>

          <div className="faq-grid">
            <details className="faq-item">
              <summary className="faq-question">
                <span>Comment fonctionne Weylo ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Weylo te permet de recevoir des messages anonymes de tes amis. Tu crées ton compte, tu partages ton lien sur tes réseaux sociaux, et tes amis peuvent t'envoyer des messages sans révéler leur identité.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Est-ce vraiment anonyme ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Oui, les messages sont 100% anonymes par défaut. L'expéditeur reste secret sauf si tu souscris à l'abonnement Premium qui te permet de révéler l'identité de ceux qui t'écrivent.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Comment puis-je gagner de l'argent sur Weylo ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Tu peux recevoir des cadeaux virtuels de tes amis (Bronze, Silver, Gold, Diamond). Ces cadeaux sont convertis en argent réel dans ton portefeuille Weylo. Tu peux ensuite retirer ton argent via MTN Mobile Money ou Orange Money.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Quel est le montant minimum pour retirer ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Le montant minimum pour effectuer un retrait est de 1 000 FCFA. Les retraits sont traités sous 24-48h ouvrées.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Comment annuler mon abonnement Premium ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Tu peux annuler ton abonnement Premium à tout moment depuis les paramètres de ton compte. L'abonnement restera actif jusqu'à la fin de la période payée.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Mes données personnelles sont-elles protégées ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Absolument. Nous prenons la sécurité très au sérieux. Toutes tes données sont chiffrées et nous ne partageons jamais tes informations personnelles avec des tiers. Consulte notre Politique de confidentialité pour plus de détails.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Puis-je bloquer des utilisateurs ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Oui, tu peux bloquer n'importe quel utilisateur. Une fois bloqué, cette personne ne pourra plus t'envoyer de messages ou interagir avec ton profil.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Sur quelles plateformes Weylo est-il disponible ?</span>
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                Weylo est disponible sur iOS (App Store), Android (Google Play) et en version web. Tu peux utiliser le même compte sur toutes les plateformes.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <img src="/logo.PNG" alt="Weylo Logo" className="footer-logo-image" />
                <h4>Weylo</h4>
              </div>
              <p>
                La plateforme de messages anonymes la plus populaire chez les jeunes.
                Connecte-toi avec tes amis d'une nouvelle façon !
              </p>
              <div className="social-links">
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="TikTok">🎵</a>
                <a href="#" aria-label="Snapchat">👻</a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Produit</h4>
              <ul className="footer-links">
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#pricing">Tarifs</a></li>
                <li><a href="#how-it-works">Comment ça marche</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Légal</h4>
              <ul className="footer-links">
                <li><a href="#cgu">Conditions d'utilisation</a></li>
                <li><a href="#privacy">Politique de confidentialité</a></li>
                <li><a href="#cookies">Politique des cookies</a></li>
                <li><a href="#">Règles de la communauté</a></li>
                <li><a href="#">Mentions légales</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-links">
                <li><a href="#">Centre d'aide</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Signaler un problème</a></li>
                <li><a href="#">Sécurité</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 Weylo. Tous droits réservés. Fait avec 💜 pour la communauté.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  )
}

export default App
