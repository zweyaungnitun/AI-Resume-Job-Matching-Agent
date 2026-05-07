import React from 'react'

interface LoadingSpinnerProps {
  message?: string
  subMessage?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { spinner: 'h-8 w-8', container: 'min-h-[200px]' },
  md: { spinner: 'h-12 w-12', container: 'min-h-[400px]' },
  lg: { spinner: 'h-16 w-16', container: 'min-h-[600px]' }
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  subMessage,
  size = 'md'
}) => {
  const { spinner, container } = sizeMap[size]

  return (
    <div className={`flex items-center justify-center ${container}`}>
      <div className="text-center space-y-4">
        <div className="relative mx-auto">
          <div className={`animate-ping absolute inset-0 rounded-full ${spinner} bg-primary/20`} />
          <div className={`animate-spin rounded-full ${spinner} border-[3px] border-primary/20 border-t-primary`} />
        </div>
        {message && <p className="text-muted-foreground">{message}</p>}
        {subMessage && <p className="text-sm text-muted-foreground">{subMessage}</p>}
      </div>
    </div>
  )
}
