import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  children: ReactNode
  variant: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

export function StatusBadge({
  children,
  variant,
  size = 'md',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  const variantClasses = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    info: 'bg-info/10 text-info border-info/20',
    default: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        sizeClasses[size],
        variantClasses[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  )
}
