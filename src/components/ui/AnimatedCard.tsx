import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  glass?: boolean
  gradient?: boolean
  hover?: boolean
  onClick?: () => void
}

export function AnimatedCard({
  children,
  className,
  glass = false,
  gradient = false,
  hover = true,
  onClick,
}: AnimatedCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-all duration-200',
        glass && 'glass',
        gradient && 'bg-gradient-card',
        !glass && !gradient && 'bg-card shadow-md',
        hover && 'hover-lift cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
