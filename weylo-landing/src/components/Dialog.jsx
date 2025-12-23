import { useEffect } from 'react'
import './Dialog.css'

const Dialog = ({
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  showCancel = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="dialog-icon dialog-icon-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="dialog-icon dialog-icon-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="dialog-icon dialog-icon-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case 'confirm':
        return (
          <div className="dialog-icon dialog-icon-confirm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="dialog-icon dialog-icon-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="dialog-overlay" onClick={showCancel ? onCancel : undefined}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-content">
          {getIcon()}
          <h3 className="dialog-title">{title}</h3>
          <p className="dialog-message">{message}</p>
        </div>
        <div className="dialog-actions">
          {showCancel && (
            <button className="dialog-button dialog-button-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button
            className={`dialog-button dialog-button-confirm dialog-button-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dialog
