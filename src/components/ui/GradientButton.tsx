import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GradientButtonProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function GradientButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
}: GradientButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'bg-gradient-primary text-primary-foreground hover-glow',
    secondary: 'bg-gradient-secondary text-secondary-foreground',
    accent: 'bg-gradient-accent text-accent-foreground',
    success: 'bg-gradient-success text-success-foreground',
  }

  return (
    <button
      type={type}
      className={cn(
        'rounded-lg font-medium transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
