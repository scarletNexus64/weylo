import { createContext, useContext, useState, useCallback } from 'react'
import Dialog from '../components/Dialog'

const DialogContext = createContext()

export const useDialog = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}

export const DialogProvider = ({ children }) => {
  const [dialogs, setDialogs] = useState([])

  const showDialog = useCallback(
    ({
      title,
      message,
      type = 'info', // 'info', 'success', 'error', 'warning', 'confirm'
      confirmText = 'OK',
      cancelText = 'Annuler',
      onConfirm,
      onCancel,
      showCancel = false,
    }) => {
      return new Promise((resolve) => {
        const id = Date.now()
        const dialog = {
          id,
          title,
          message,
          type,
          confirmText,
          cancelText,
          showCancel,
          onConfirm: () => {
            setDialogs((prev) => prev.filter((d) => d.id !== id))
            if (onConfirm) onConfirm()
            resolve(true)
          },
          onCancel: () => {
            setDialogs((prev) => prev.filter((d) => d.id !== id))
            if (onCancel) onCancel()
            resolve(false)
          },
        }
        setDialogs((prev) => [...prev, dialog])
      })
    },
    []
  )

  const alert = useCallback(
    (message, type = 'info', title = null) => {
      return showDialog({
        title: title || (type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Information'),
        message,
        type,
        confirmText: 'OK',
        showCancel: false,
      })
    },
    [showDialog]
  )

  const confirm = useCallback(
    (message, title = 'Confirmation') => {
      return showDialog({
        title,
        message,
        type: 'confirm',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        showCancel: true,
      })
    },
    [showDialog]
  )

  const success = useCallback(
    (message, title = 'Succès') => {
      return alert(message, 'success', title)
    },
    [alert]
  )

  const error = useCallback(
    (message, title = 'Erreur') => {
      return alert(message, 'error', title)
    },
    [alert]
  )

  const warning = useCallback(
    (message, title = 'Attention') => {
      return alert(message, 'warning', title)
    },
    [alert]
  )

  const info = useCallback(
    (message, title = 'Information') => {
      return alert(message, 'info', title)
    },
    [alert]
  )

  const value = {
    showDialog,
    alert,
    confirm,
    success,
    error,
    warning,
    info,
  }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialogs.map((dialog) => (
        <Dialog key={dialog.id} {...dialog} />
      ))}
    </DialogContext.Provider>
  )
}
