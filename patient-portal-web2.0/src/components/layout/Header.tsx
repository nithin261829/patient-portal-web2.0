import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User, Calendar, FileText, CreditCard, Bell, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth-store'
import { getInitials } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

// Import dropdown menu component
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"
import * as React from "react"

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

// Navigation items configuration
const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/dashboard/appointments', label: 'Appointments', mobileLabel: 'Appts', icon: Calendar },
  { path: '/dashboard/forms', label: 'Forms', icon: FileText },
  { path: '/dashboard/payments', label: 'Payments', mobileLabel: 'Pay', icon: CreditCard },
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { patient, clinic, logout } = useAuthStore()
  const isMobile = useIsMobile()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient'

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isMobile && "h-14"
      )}>
        <div className={cn(
          "container flex items-center justify-between px-4",
          isMobile ? "h-14" : "h-16"
        )}>
          {/* Logo and Clinic Name */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              {clinic?.logo ? (
                <img
                  src={clinic.logo}
                  alt={clinic.clinicName}
                  className={cn(
                    "object-contain",
                    isMobile ? "h-7 w-7" : "h-8 w-8"
                  )}
                />
              ) : (
                <div className={cn(
                  "rounded-lg bg-primary flex items-center justify-center",
                  isMobile ? "h-7 w-7" : "h-8 w-8"
                )}>
                  <span className={cn(
                    "text-primary-foreground font-bold",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {clinic?.clinicName?.[0] || 'P'}
                  </span>
                </div>
              )}
              <span className={cn(
                "font-semibold text-foreground",
                isMobile ? "text-sm max-w-[120px] truncate" : "hidden sm:inline-block"
              )}>
                {clinic?.clinicName || 'Patient Portal'}
              </span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Right side - User menu */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className={cn(isMobile && "h-9 w-9")}
            >
              <Link to="/dashboard/notifications">
                <Bell className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
              </Link>
            </Button>

            {/* User dropdown */}
            <DropdownMenuPrimitive.Root>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative rounded-full",
                    isMobile ? "h-8 w-8" : "h-9 w-9"
                  )}
                >
                  <Avatar className={cn(isMobile ? "h-8 w-8" : "h-9 w-9")}>
                    <AvatarImage src="" alt={patientName} />
                    <AvatarFallback className={cn(isMobile && "text-xs")}>
                      {getInitials(patientName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn("w-56", isMobile && "w-48")}
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className={cn(
                      "font-medium leading-none",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {patientName}
                    </p>
                    <p className={cn(
                      "leading-none text-muted-foreground",
                      isMobile ? "text-[11px]" : "text-xs"
                    )}>
                      {patient?.phoneNumber || patient?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/dashboard/profile')}
                  className={cn(isMobile && "text-sm py-2")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className={cn("text-error", isMobile && "text-sm py-2")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPrimitive.Root>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1.5 px-1 rounded-lg transition-colors touch-manipulation",
                    active
                      ? "text-primary"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-full transition-all",
                    active ? "bg-primary/10 p-2" : "p-1.5"
                  )}>
                    <item.icon className={cn(
                      "transition-all",
                      active ? "h-5 w-5" : "h-5 w-5"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-0.5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.mobileLabel || item.label}
                  </span>
                </Link>
              )
            })}
            {/* Profile link in bottom nav */}
            <Link
              to="/dashboard/profile"
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1.5 px-1 rounded-lg transition-colors touch-manipulation",
                isActive('/dashboard/profile')
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full transition-all",
                isActive('/dashboard/profile') ? "bg-primary/10 p-2" : "p-1.5"
              )}>
                <User className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors",
                isActive('/dashboard/profile') ? "text-primary" : "text-muted-foreground"
              )}>
                Profile
              </span>
            </Link>
          </div>
        </nav>
      )}
    </>
  )
}
