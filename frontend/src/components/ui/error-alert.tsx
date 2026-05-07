import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorAlertProps {
  message: string
  className?: string
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, className = '' }) => {
  if (!message) return null

  return (
    <div
      className={`flex gap-3 rounded-xl border border-destructive/40 bg-destructive/8 p-4 shadow-sm ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}
