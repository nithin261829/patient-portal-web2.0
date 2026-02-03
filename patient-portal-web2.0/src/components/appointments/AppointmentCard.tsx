import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import {
  Clock,
  User,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Appointment } from '@/types'
import { useIsMobile } from '@/hooks/use-mobile'

interface AppointmentCardProps {
  appointment: Appointment
  onConfirm?: (id: string | number) => void
  onCancel?: (id: string | number) => void
  onReschedule?: (id: string | number) => void
  onViewDetails?: (id: string | number) => void
  variant?: 'default' | 'compact'
  className?: string
}

export function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onReschedule,
  onViewDetails,
  variant = 'default',
  className
}: AppointmentCardProps) {
  const isMobile = useIsMobile()
  const appointmentDate = new Date(appointment.appointmentDateTime)
  const isPastAppointment = isPast(appointmentDate)
  const daysUntil = differenceInDays(appointmentDate, new Date())

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('confirm')) return { label: 'Confirmed', variant: 'success' as const, icon: CheckCircle2 }
    if (s.includes('cancel')) return { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
    if (s.includes('complete')) return { label: 'Completed', variant: 'secondary' as const, icon: CheckCircle2 }
    if (s.includes('reschedule')) return { label: 'Rescheduled', variant: 'info' as const, icon: CalendarClock }
    return { label: 'Scheduled', variant: 'warning' as const, icon: Clock }
  }

  const statusConfig = getStatusConfig(appointment.appointmentStatus)
  const StatusIcon = statusConfig.icon

  const getDateLabel = () => {
    if (isToday(appointmentDate)) return 'Today'
    if (isTomorrow(appointmentDate)) return 'Tomorrow'
    if (daysUntil > 0 && daysUntil <= 7) return `In ${daysUntil} days`
    return format(appointmentDate, 'EEE, MMM d')
  }

  const getTimeDisplay = () => format(appointmentDate, 'h:mm a')

  // Compact variant - for lists
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
          isMobile ? "active:bg-muted/50" : "hover:shadow-md hover:border-primary/20",
          "transition-all cursor-pointer touch-manipulation",
          isPastAppointment && "opacity-60",
          className
        )}
        onClick={() => onViewDetails?.(appointment.appointmentNumber)}
      >
        {/* Date Block */}
        <div className={cn(
          "flex-shrink-0 rounded-xl bg-primary/10 flex flex-col items-center justify-center",
          isMobile ? "w-12 h-12" : "w-14 h-14"
        )}>
          <span className="text-[10px] font-medium text-primary uppercase">
            {format(appointmentDate, 'MMM')}
          </span>
          <span className={cn(
            "font-bold text-primary leading-none",
            isMobile ? "text-lg" : "text-xl"
          )}>
            {format(appointmentDate, 'd')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={cn(
              "font-medium text-foreground truncate",
              isMobile ? "text-sm" : "text-base"
            )}>
              {appointment.appointmentTypeName || 'Dental Appointment'}
            </h4>
          </div>
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeDisplay()}
            </span>
            {appointment.providerName && (
              <span className="flex items-center gap-1 truncate">
                <User className="h-3 w-3" />
                {appointment.providerName}
              </span>
            )}
          </div>
        </div>

        {/* Status & Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusConfig.variant} className={cn(isMobile && "text-[10px] px-1.5 h-5")}>
            {statusConfig.label}
          </Badge>
          <ChevronRight className={cn(
            "text-muted-foreground",
            isMobile ? "h-4 w-4" : "h-5 w-5"
          )} />
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        isMobile ? "p-4" : "p-5",
        isPastAppointment && "opacity-60",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 rounded-xl bg-primary/10 flex flex-col items-center justify-center",
            isMobile ? "w-12 h-12" : "w-14 h-14"
          )}>
            <span className="text-[10px] font-medium text-primary uppercase">
              {format(appointmentDate, 'MMM')}
            </span>
            <span className={cn(
              "font-bold text-primary leading-none",
              isMobile ? "text-lg" : "text-xl"
            )}>
              {format(appointmentDate, 'd')}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-primary mb-0.5">{getDateLabel()}</p>
            <h4 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {appointment.appointmentTypeName || 'Dental Appointment'}
            </h4>
          </div>
        </div>
        <Badge variant={statusConfig.variant} className={cn(isMobile && "text-[10px] px-1.5 h-5")}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Details */}
      <div className={cn(
        "flex items-center gap-3 text-muted-foreground mb-4",
        isMobile ? "text-xs" : "text-sm"
      )}>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {getTimeDisplay()}
        </span>
        {appointment.duration && (
          <span>{appointment.duration} min</span>
        )}
        {appointment.providerName && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            Dr. {appointment.providerName}
          </span>
        )}
      </div>

      {/* Actions */}
      {!isPastAppointment && (
        <div className="flex items-center gap-2">
          {statusConfig.variant !== 'success' && onConfirm && (
            <Button
              size={isMobile ? "sm" : "default"}
              className="flex-1"
              onClick={() => onConfirm(appointment.appointmentNumber)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          )}
          {onReschedule && (
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => onReschedule(appointment.appointmentNumber)}
            >
              Reschedule
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              className="text-error hover:text-error hover:bg-error/10"
              onClick={() => onCancel(appointment.appointmentNumber)}
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {isPastAppointment && (
        <p className="text-xs text-muted-foreground text-center py-2">
          This appointment has passed
        </p>
      )}
    </div>
  )
}
