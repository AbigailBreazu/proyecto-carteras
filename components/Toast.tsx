'use client'
import { useEffect } from 'react'
import styles from './toast.module.css'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export default function Toast({ message, type = 'success', duration, onClose, action }: ToastProps) {
  useEffect(() => {
    if (duration && !action) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose, action])

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  }

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{icons[type]}</span>
        <span className={styles.message}>{message}</span>
      </div>
      {action && (
        <button onClick={action.onClick} className={styles.actionBtn}>
          {action.label}
        </button>
      )}
      {!action && (
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      )}
    </div>
  )
}
