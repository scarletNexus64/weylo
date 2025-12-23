import { useEffect, useState } from 'react'
import './Maintenance.css'

const Maintenance = ({ message, estimatedEndTime }) => {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    if (!estimatedEndTime) return

    const updateTimer = () => {
      const now = new Date()
      const end = new Date(estimatedEndTime)
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining('')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeRemaining(`Retour prévu dans ${hours}h ${minutes}min`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [estimatedEndTime])

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <div className="maintenance-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <h1>Mode Maintenance</h1>

        <p className="maintenance-message">
          {message || 'Le site est actuellement en maintenance. Nous reviendrons bientôt !'}
        </p>

        {timeRemaining && (
          <p className="maintenance-timer">{timeRemaining}</p>
        )}

        <div className="maintenance-footer">
          <p>Merci pour votre patience</p>
        </div>
      </div>
    </div>
  )
}

export default Maintenance
