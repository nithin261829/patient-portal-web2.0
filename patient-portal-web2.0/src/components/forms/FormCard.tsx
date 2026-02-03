import { format, isPast } from 'date-fns'
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  FileClock,
  FileX,
  Edit3,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useIsMobile } from '@/hooks/use-mobile'

export interface FormData {
  id: string | number
  title: string
  description?: string
  category?: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'submitted'
  dueDate?: string
  submittedDate?: string
  completedSections?: number
  totalSections?: number
  estimatedTime?: number
  isRequired?: boolean
  assignedBy?: string
  appointmentId?: string | number
}

interface FormCardProps {
  form: FormData
  onStart?: (id: string | number) => void
  onContinue?: (id: string | number) => void
  onView?: (id: string | number) => void
  variant?: 'default' | 'compact'
  className?: string
}

export function FormCard({
  form,
  onStart,
  onContinue,
  onView,
  variant = 'default',
  className
}: FormCardProps) {
  const isMobile = useIsMobile()

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        return {
          label: status === 'submitted' ? 'Submitted' : 'Completed',
          variant: 'success' as const,
          icon: FileCheck
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          variant: 'info' as const,
          icon: FileClock
        }
      case 'expired':
        return {
          label: 'Expired',
          variant: 'destructive' as const,
          icon: FileX
        }
      default:
        return {
          label: 'Pending',
          variant: 'warning' as const,
          icon: FileClock
        }
    }
  }

  const statusConfig = getStatusConfig(form.status)
  const StatusIcon = statusConfig.icon
  const progress = form.completedSections && form.totalSections
    ? Math.round((form.completedSections / form.totalSections) * 100)
    : 0
  const isOverdue = form.dueDate && isPast(new Date(form.dueDate)) && form.status !== 'completed' && form.status !== 'submitted'
  const isCompleted = form.status === 'completed' || form.status === 'submitted'

  const handleClick = () => {
    if (isCompleted) {
      onView?.(form.id)
    } else if (form.status === 'in_progress') {
      onContinue?.(form.id)
    } else {
      onStart?.(form.id)
    }
  }

  // Compact variant - for lists
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
          isMobile ? "active:bg-muted/50" : "hover:shadow-md hover:border-primary/20",
          "transition-all cursor-pointer touch-manipulation",
          isCompleted && "opacity-70",
          className
        )}
        onClick={handleClick}
      >
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 rounded-xl flex items-center justify-center",
          isMobile ? "w-10 h-10" : "w-12 h-12",
          statusConfig.variant === 'success' && "bg-success/10",
          statusConfig.variant === 'info' && "bg-info/10",
          statusConfig.variant === 'warning' && "bg-warning/10",
          statusConfig.variant === 'destructive' && "bg-error/10"
        )}>
          <StatusIcon className={cn(
            isMobile ? "h-5 w-5" : "h-6 w-6",
            statusConfig.variant === 'success' && "text-success",
            statusConfig.variant === 'info' && "text-info",
            statusConfig.variant === 'warning' && "text-warning",
            statusConfig.variant === 'destructive' && "text-error"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={cn(
              "font-medium text-foreground truncate",
              isMobile ? "text-sm" : "text-base"
            )}>
              {form.title}
            </h4>
            {form.isRequired && (
              <Badge variant="destructive" className="text-[10px] px-1.5 h-5 shrink-0">
                Required
              </Badge>
            )}
          </div>
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {form.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {form.estimatedTime}m
              </span>
            )}
            {form.dueDate && (
              <span className={cn(
                "flex items-center gap-1",
                isOverdue && "text-error font-medium"
              )}>
                <Calendar className="h-3 w-3" />
                {isOverdue ? 'Overdue' : format(new Date(form.dueDate), 'MMM d')}
              </span>
            )}
            <Badge variant={statusConfig.variant} className={cn(isMobile && "text-[10px] px-1.5 h-5")}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className={cn(
          "text-muted-foreground shrink-0",
          isMobile ? "h-4 w-4" : "h-5 w-5"
        )} />
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card touch-manipulation",
        isMobile ? "p-4" : "p-5",
        isCompleted && "opacity-70",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "rounded-xl flex items-center justify-center shrink-0",
            isMobile ? "w-10 h-10" : "w-12 h-12",
            statusConfig.variant === 'success' && "bg-success/10",
            statusConfig.variant === 'info' && "bg-info/10",
            statusConfig.variant === 'warning' && "bg-warning/10",
            statusConfig.variant === 'destructive' && "bg-error/10"
          )}>
            <StatusIcon className={cn(
              isMobile ? "h-5 w-5" : "h-6 w-6",
              statusConfig.variant === 'success' && "text-success",
              statusConfig.variant === 'info' && "text-info",
              statusConfig.variant === 'warning' && "text-warning",
              statusConfig.variant === 'destructive' && "text-error"
            )} />
          </div>
          <div className="min-w-0">
            <h4 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {form.title}
            </h4>
            {form.isRequired && (
              <span className="text-error text-xs font-medium">* Required</span>
            )}
          </div>
        </div>
        <Badge variant={statusConfig.variant} className={cn("shrink-0", isMobile && "text-[10px] px-1.5 h-5")}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Description */}
      {form.description && (
        <p className={cn(
          "text-muted-foreground line-clamp-2 mb-3",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {form.description}
        </p>
      )}

      {/* Progress bar for in-progress forms */}
      {form.status === 'in_progress' && form.totalSections && (
        <div className="mb-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {form.completedSections}/{form.totalSections} sections
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Meta info */}
      <div className={cn(
        "flex items-center gap-2 mb-4",
        isMobile ? "text-xs" : "text-sm"
      )}>
        {form.estimatedTime && (
          <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <Clock className="h-3 w-3" />
            {form.estimatedTime} min
          </span>
        )}
        {form.dueDate && (
          <span className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md",
            isOverdue
              ? "text-error bg-error/10 font-medium"
              : "text-muted-foreground bg-muted/50"
          )}>
            <Calendar className="h-3 w-3" />
            {isOverdue ? 'Overdue' : `Due ${format(new Date(form.dueDate), 'MMM d')}`}
          </span>
        )}
      </div>

      {/* Action Button */}
      {!isCompleted && form.status !== 'expired' && (
        <Button
          className={cn("w-full", isMobile && "h-10 text-sm")}
          variant={form.status === 'in_progress' ? 'default' : 'outline'}
          onClick={handleClick}
        >
          {form.status === 'in_progress' ? (
            <>
              <Edit3 className="h-4 w-4 mr-2" />
              Continue Form
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Start Form
            </>
          )}
        </Button>
      )}

      {isCompleted && (
        <Button
          variant="ghost"
          className={cn("w-full", isMobile && "h-10 text-sm")}
          onClick={() => onView?.(form.id)}
        >
          <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
          View Submission
        </Button>
      )}
    </div>
  )
}
