import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  type LucideIcon
} from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-info/10 text-info border-info/30 [&>svg]:text-info",
        success: "bg-success/10 text-success border-success/30 [&>svg]:text-success",
        warning: "bg-warning/10 text-warning border-warning/30 [&>svg]:text-warning",
        error: "bg-error/10 text-error border-error/30 [&>svg]:text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap: Record<string, LucideIcon> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void
  icon?: LucideIcon
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, onClose, icon, ...props }, ref) => {
    const Icon = icon || iconMap[variant || "default"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex gap-3">
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">{children}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm mt-1 opacity-90", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Banner-style alert for top of page
interface AlertBannerProps extends AlertProps {
  action?: {
    label: string
    onClick: () => void
  }
}

function AlertBanner({
  variant = "info",
  children,
  action,
  onClose,
  className,
  ...props
}: AlertBannerProps) {
  const Icon = iconMap[variant || "info"]

  return (
    <div
      className={cn(
        "w-full px-4 py-3 flex items-center justify-center gap-3 text-sm",
        variant === "info" && "bg-info/10 text-info",
        variant === "success" && "bg-success/10 text-success",
        variant === "warning" && "bg-warning/10 text-warning",
        variant === "error" && "bg-error/10 text-error",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-center">{children}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          {action.label}
        </button>
      )}
      {onClose && (
        <button onClick={onClose} className="shrink-0 p-1 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export { Alert, AlertTitle, AlertDescription, AlertBanner, alertVariants }
