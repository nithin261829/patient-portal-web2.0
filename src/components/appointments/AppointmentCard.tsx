import { format, parse, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
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

  // Parse appointment datetime (format: 'yyyy-MM-dd HH:mm:ss' - matching Angular)
  const appointmentDate = appointment.appointmentDateTime.includes('T')
    ? new Date(appointment.appointmentDateTime) // ISO format (legacy)
    : parse(appointment.appointmentDateTime, 'yyyy-MM-dd HH:mm:ss', new Date()) // Local format

  const isPastAppointment = isPast(appointmentDate)
  const daysUntil = differenceInDays(appointmentDate, new Date())

  // Check if appointment is cancelled (matching Angular logic)
  const isCancelled = () => {
    const note = (appointment.notes || '').toLowerCase()
    return note.includes('cancelled by')
  }

  const getStatusConfig = (status: string, confirmed?: string) => {
    // Check cancellation first
    if (isCancelled()) {
      return { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
    }

    const s = status?.toLowerCase() || ''

    // Check if confirmed (Angular logic: confirmed field + scheduled status)
    if (confirmed === 'Confirmed' && s === 'scheduled') {
      return { label: 'Confirmed', variant: 'success' as const, icon: CheckCircle2 }
    }

    // Status-based display
    if (s === 'complete' || s === 'completed') {
      return { label: 'Completed', variant: 'secondary' as const, icon: CheckCircle2 }
    }
    if (s === 'broken') {
      return { label: 'Missed', variant: 'destructive' as const, icon: XCircle }
    }
    if (s === 'unschedlist') {
      return { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
    }
    if (s === 'planned') {
      return { label: 'Planned', variant: 'secondary' as const, icon: CalendarClock }
    }
    if (s === 'scheduled') {
      return { label: 'Scheduled', variant: 'default' as const, icon: Clock }
    }

    return { label: status || 'Unknown', variant: 'secondary' as const, icon: Clock }
  }

  const statusConfig = getStatusConfig(
    appointment.appointmentStatus,
    (appointment as any).confirmed
  )
  const StatusIcon = statusConfig.icon

  // Action button visibility logic (matching Angular)
  const showConfirmButton = () => {
    return appointment.appointmentStatus === 'Scheduled' &&
           (appointment as any).confirmed !== 'Confirmed' &&
           !isPastAppointment &&
           !isCancelled()
  }

  const showRescheduleButton = () => {
    return !isPastAppointment && !isCancelled()
  }

  const showCancelButton = () => {
    return !isPastAppointment && !isCancelled()
  }

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
        "space-y-2 text-muted-foreground mb-4",
        isMobile ? "text-xs" : "text-sm"
      )}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {getTimeDisplay()}
          </span>
          {(appointment.duration || appointment.lengthInMinutes) && (
            <span>{appointment.duration || appointment.lengthInMinutes} minutes</span>
          )}
        </div>
        {appointment.providerName && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {appointment.providerName}
          </div>
        )}
        {(appointment as any).insuranceStatus && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Insurance:</span>
            <span>{(appointment as any).insuranceStatus}</span>
          </div>
        )}
      </div>

      {/* Actions - Matching Angular visibility logic */}
      {(showConfirmButton() || showRescheduleButton() || showCancelButton()) && (
        <div className="flex items-center gap-2">
          {showConfirmButton() && onConfirm && (
            <Button
              size={isMobile ? "sm" : "default"}
              variant="default"
              className="flex-1"
              onClick={() => onConfirm(appointment.appointmentNumber)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          )}
          {showRescheduleButton() && onReschedule && (
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="flex-1"
              onClick={() => onReschedule(appointment.appointmentNumber)}
            >
              <CalendarClock className="h-4 w-4 mr-1" />
              Reschedule
            </Button>
          )}
          {showCancelButton() && onCancel && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onCancel(appointment.appointmentNumber)}
            >
              <XCircle className="h-4 w-4 mr-1" />
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
