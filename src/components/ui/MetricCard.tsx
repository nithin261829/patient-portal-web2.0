import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  iconColor?: string
  className?: string
}

export function MetricCard({
  icon: Icon,
  value,
  label,
  subtitle,
  trend,
  trendValue,
  iconColor = 'bg-primary',
  className,
}: MetricCardProps) {
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-muted-foreground',
  }

  return (
    <div
      className={cn(
        'bg-card rounded-lg p-6 shadow-md hover-lift transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('p-3 rounded-lg', iconColor)}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
          )}
        </div>
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColors[trend])}>
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}
