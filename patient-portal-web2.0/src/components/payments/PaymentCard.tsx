import { format } from 'date-fns'
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  ChevronRight,
  Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'

export interface PaymentData {
  id: string | number
  amount: number
  description: string
  status: 'pending' | 'paid' | 'overdue' | 'processing' | 'failed'
  dueDate?: string
  paidDate?: string
  invoiceNumber?: string
  paymentMethod?: string
  appointmentDate?: string
  providerName?: string
  category?: 'treatment' | 'copay' | 'deductible' | 'other'
}

interface PaymentCardProps {
  payment: PaymentData
  onPay?: (id: string | number) => void
  onViewDetails?: (id: string | number) => void
  variant?: 'default' | 'compact'
  className?: string
}

export function PaymentCard({
  payment,
  onPay,
  onViewDetails,
  variant = 'default',
  className
}: PaymentCardProps) {
  const isMobile = useIsMobile()

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Paid', variant: 'success' as const, icon: CheckCircle2 }
      case 'overdue':
        return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle }
      case 'processing':
        return { label: 'Processing', variant: 'info' as const, icon: Clock }
      case 'failed':
        return { label: 'Failed', variant: 'destructive' as const, icon: AlertCircle }
      default:
        return { label: 'Due', variant: 'warning' as const, icon: Clock }
    }
  }

  const statusConfig = getStatusConfig(payment.status)
  const StatusIcon = statusConfig.icon
  const isPaid = payment.status === 'paid'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Compact variant - for lists
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
          isMobile ? "active:bg-muted/50" : "hover:shadow-md hover:border-primary/20",
          "transition-all cursor-pointer touch-manipulation",
          className
        )}
        onClick={() => onViewDetails?.(payment.id)}
      >
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 rounded-xl flex items-center justify-center",
          isMobile ? "w-10 h-10" : "w-12 h-12",
          isPaid ? "bg-success/10" : payment.status === 'overdue' ? "bg-error/10" : "bg-warning/10"
        )}>
          {isPaid ? (
            <CheckCircle2 className={cn(isMobile ? "h-5 w-5" : "h-6 w-6", "text-success")} />
          ) : (
            <DollarSign className={cn(
              isMobile ? "h-5 w-5" : "h-6 w-6",
              payment.status === 'overdue' ? "text-error" : "text-warning"
            )} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-foreground truncate mb-0.5",
            isMobile ? "text-sm" : "text-base"
          )}>
            {payment.description}
          </h4>
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {payment.invoiceNumber && (
              <span className="flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                #{payment.invoiceNumber}
              </span>
            )}
            {(payment.dueDate || payment.paidDate) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isPaid
                  ? `Paid ${format(new Date(payment.paidDate!), 'MMM d')}`
                  : `Due ${format(new Date(payment.dueDate!), 'MMM d')}`}
              </span>
            )}
          </div>
        </div>

        {/* Amount & Status */}
        <div className="text-right shrink-0">
          <p className={cn(
            "font-semibold",
            isMobile ? "text-sm" : "text-base",
            isPaid ? "text-muted-foreground" : "text-foreground"
          )}>
            {formatCurrency(payment.amount)}
          </p>
          <Badge
            variant={statusConfig.variant}
            className={cn("mt-1", isMobile && "text-[10px] px-1.5 h-5")}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {!isMobile && (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card touch-manipulation",
        isMobile ? "p-4" : "p-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "rounded-xl flex items-center justify-center",
          isMobile ? "w-10 h-10" : "w-12 h-12",
          isPaid ? "bg-success/10" : payment.status === 'overdue' ? "bg-error/10" : "bg-warning/10"
        )}>
          <DollarSign className={cn(
            isMobile ? "h-5 w-5" : "h-6 w-6",
            isPaid ? "text-success" : payment.status === 'overdue' ? "text-error" : "text-warning"
          )} />
        </div>
        <Badge variant={statusConfig.variant} className={cn(isMobile && "text-[10px] px-1.5 h-5")}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h4 className={cn("font-semibold text-foreground mb-1", isMobile && "text-sm")}>
          {payment.description}
        </h4>
        {payment.invoiceNumber && (
          <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
            Invoice #{payment.invoiceNumber}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className={cn("rounded-lg bg-muted/50 p-3 mb-3", isMobile && "p-2.5")}>
        <div className="flex items-center justify-between">
          <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
            Amount
          </span>
          <span className={cn(
            "font-bold",
            isMobile ? "text-lg" : "text-xl",
            isPaid ? "text-muted-foreground" : "text-foreground"
          )}>
            {formatCurrency(payment.amount)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className={cn(
        "flex items-center gap-2 text-muted-foreground mb-3",
        isMobile ? "text-xs" : "text-sm"
      )}>
        {payment.dueDate && !isPaid && (
          <span className={cn(
            "flex items-center gap-1",
            payment.status === 'overdue' && "text-error font-medium"
          )}>
            <Calendar className="h-3 w-3" />
            Due {format(new Date(payment.dueDate), 'MMM d')}
          </span>
        )}
        {payment.paidDate && (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3 w-3" />
            Paid {format(new Date(payment.paidDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Actions */}
      {!isPaid && payment.status !== 'processing' ? (
        <Button
          className={cn("w-full", isMobile && "h-10 text-sm")}
          onClick={() => onPay?.(payment.id)}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Pay Now
        </Button>
      ) : (
        <Button
          variant="ghost"
          className={cn("w-full", isMobile && "h-10 text-sm")}
          onClick={() => onViewDetails?.(payment.id)}
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}
