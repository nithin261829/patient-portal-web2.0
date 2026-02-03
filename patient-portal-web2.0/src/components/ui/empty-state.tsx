import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import {
  Calendar,
  FileText,
  CreditCard,
  Bell,
  Search,
  Inbox,
  type LucideIcon
} from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "minimal" | "card"
}

const presetIcons: Record<string, LucideIcon> = {
  appointments: Calendar,
  forms: FileText,
  payments: CreditCard,
  notifications: Bell,
  search: Search,
  default: Inbox,
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  const IconComponent = Icon || presetIcons.default

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center",
          className
        )}
        {...props}
      >
        <div className="text-muted-foreground mb-2">
          <IconComponent className="h-8 w-8 mx-auto" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        {action && (
          <Button variant="link" size="sm" onClick={action.onClick} className="mt-2">
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center",
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <IconComponent className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex items-center justify-center gap-3">
            {action && (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Default variant - full page style
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] py-12 text-center",
        className
      )}
      {...props}
    >
      <div className="mb-6 relative">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <IconComponent className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-primary/30" />
        <div className="absolute -bottom-1 -left-3 h-2 w-2 rounded-full bg-primary/20" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button size="lg" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" size="lg" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Pre-built empty states for common scenarios
function EmptyAppointments({ onSchedule }: { onSchedule: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming appointments"
      description="You don't have any appointments scheduled. Book your next visit to keep your smile healthy!"
      action={{ label: "Schedule Appointment", onClick: onSchedule }}
    />
  )
}

function EmptyForms({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No pending forms"
      description="You're all caught up! There are no forms waiting for your attention."
      action={{ label: "Browse Forms", onClick: onBrowse }}
      variant="card"
    />
  )
}

function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="No notifications"
      description="You're all caught up! We'll notify you when there's something new."
      variant="minimal"
    />
  )
}

function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or filters to find what you're looking for."
      variant="card"
    />
  )
}

export {
  EmptyState,
  EmptyAppointments,
  EmptyForms,
  EmptyNotifications,
  EmptySearch
}
