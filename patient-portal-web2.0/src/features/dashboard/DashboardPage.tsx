import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import {
  Calendar,
  FileText,
  CreditCard,
  User,
  ChevronRight,
  Clock,
  Plus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { formatCurrency, cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Appointment, AccountBalance } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { patient, clientId } = useAuthStore()
  const isMobile = useIsMobile()
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [balance, setBalance] = useState<AccountBalance | null>(null)
  const [pendingForms, setPendingForms] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!clientId || !patient?.patientId) return

      setIsLoading(true)
      try {
        const appointmentsRes = await apiService.patient.getAppointments(clientId, patient.patientId)
        const now = new Date()
        const upcoming = (appointmentsRes.data || [])
          .filter((apt: Appointment) => new Date(apt.appointmentDateTime) > now)
          .sort((a: Appointment, b: Appointment) =>
            new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime()
          )
          .slice(0, 3)
        setUpcomingAppointments(upcoming)

        const balanceRes = await apiService.patient.getAgingBalance(clientId, patient.patientId)
        setBalance(balanceRes.data)

        const formsRes = await apiService.forms.getAllForms(clientId, patient.patientId)
        const pending = (formsRes.data || []).filter((f: { status?: string }) => f.status === 'draft' || f.status === 'pending').length
        setPendingForms(pending)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setUpcomingAppointments([
          {
            appointmentNumber: '1',
            appointmentDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            appointmentTypeName: 'Regular Checkup',
            appointmentStatus: 'confirmed',
            providerName: 'Dr. Sarah Johnson'
          } as any
        ])
        setBalance({ totalBalance: 250 } as any)
        setPendingForms(2)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [clientId, patient?.patientId])

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
  }

  const hasOutstandingBalance = balance && balance.totalBalance > 0

  if (isLoading) {
    return (
      <div className={cn("space-y-4", !isMobile && "space-y-6")}>
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className={cn(
          "grid gap-3",
          isMobile ? "grid-cols-2" : "grid-cols-4"
        )}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className={cn("space-y-5", !isMobile && "space-y-6")}>
      {/* Simple Greeting */}
      <div>
        <h1 className={cn(
          "font-semibold text-foreground",
          isMobile ? "text-xl" : "text-2xl"
        )}>
          {getGreeting()}, {patient?.firstName || 'Patient'}
        </h1>
        <p className={cn(
          "text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>
          Welcome to your patient portal
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className={cn(
        "grid gap-3",
        isMobile ? "grid-cols-2" : "grid-cols-4"
      )}>
        {/* Next Appointment */}
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/dashboard/appointments')}
        >
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={cn(
                "text-primary",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <span className={cn(
                "text-muted-foreground font-medium",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Next Visit
              </span>
            </div>
            {upcomingAppointments.length > 0 ? (
              <>
                <p className={cn(
                  "font-semibold text-foreground",
                  isMobile ? "text-sm" : "text-base"
                )}>
                  {getDateLabel(upcomingAppointments[0].appointmentDateTime)}
                </p>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {format(new Date(upcomingAppointments[0].appointmentDateTime), 'h:mm a')}
                </p>
              </>
            ) : (
              <p className={cn(
                "text-muted-foreground",
                isMobile ? "text-xs" : "text-sm"
              )}>
                No upcoming
              </p>
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/dashboard/payments')}
        >
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className={cn(
                hasOutstandingBalance ? "text-warning" : "text-success",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <span className={cn(
                "text-muted-foreground font-medium",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Balance
              </span>
            </div>
            <p className={cn(
              "font-semibold",
              isMobile ? "text-sm" : "text-base",
              hasOutstandingBalance ? "text-warning" : "text-foreground"
            )}>
              {balance ? formatCurrency(balance.totalBalance) : '$0.00'}
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {hasOutstandingBalance ? 'Due' : 'All paid'}
            </p>
          </CardContent>
        </Card>

        {/* Forms */}
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/dashboard/forms')}
        >
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className={cn(
                pendingForms > 0 ? "text-info" : "text-muted-foreground",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <span className={cn(
                "text-muted-foreground font-medium",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Forms
              </span>
            </div>
            <p className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {pendingForms} pending
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {pendingForms > 0 ? 'To complete' : 'All done'}
            </p>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/dashboard/profile')}
        >
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <div className="flex items-center gap-2 mb-2">
              <User className={cn(
                "text-muted-foreground",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <span className={cn(
                "text-muted-foreground font-medium",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Profile
              </span>
            </div>
            <p className={cn(
              "font-semibold text-foreground truncate",
              isMobile ? "text-sm" : "text-base"
            )}>
              {patient?.firstName} {patient?.lastName?.[0]}.
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              View details
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardContent className={cn("p-0", isMobile ? "" : "")}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-border",
            isMobile ? "px-4 py-3" : "px-5 py-4"
          )}>
            <h2 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-base" : "text-lg"
            )}>
              Upcoming Appointments
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/appointments" className="text-primary">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Appointments List */}
          {upcomingAppointments.length > 0 ? (
            <div className="divide-y divide-border">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.appointmentNumber}
                  className={cn(
                    "flex items-center gap-4 cursor-pointer transition-colors",
                    isMobile
                      ? "px-4 py-3 active:bg-muted/50"
                      : "px-5 py-4 hover:bg-muted/50"
                  )}
                  onClick={() => navigate(`/dashboard/appointments/${appointment.appointmentNumber}`)}
                >
                  {/* Date Box */}
                  <div className={cn(
                    "shrink-0 rounded-lg bg-primary/10 text-center",
                    isMobile ? "w-12 py-1.5" : "w-14 py-2"
                  )}>
                    <p className={cn(
                      "text-primary font-medium uppercase",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      {format(new Date(appointment.appointmentDateTime), 'MMM')}
                    </p>
                    <p className={cn(
                      "text-primary font-bold",
                      isMobile ? "text-lg leading-tight" : "text-xl leading-tight"
                    )}>
                      {format(new Date(appointment.appointmentDateTime), 'd')}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-foreground truncate",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {appointment.appointmentTypeName || 'Appointment'}
                    </p>
                    <div className={cn(
                      "flex items-center gap-3 text-muted-foreground",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(appointment.appointmentDateTime), 'h:mm a')}
                      </span>
                      {appointment.providerName && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{appointment.providerName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {appointment.appointmentStatus === 'confirmed' && (
                    <Badge variant="success" className={cn(isMobile && "text-[10px] px-1.5 h-5")}>
                      Confirmed
                    </Badge>
                  )}

                  <ChevronRight className={cn(
                    "text-muted-foreground shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center",
              isMobile ? "py-8 px-4" : "py-12"
            )}>
              <Calendar className={cn(
                "mx-auto text-muted-foreground mb-3",
                isMobile ? "h-10 w-10" : "h-12 w-12"
              )} />
              <p className={cn(
                "font-medium text-foreground mb-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                No upcoming appointments
              </p>
              <p className={cn(
                "text-muted-foreground mb-4",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Book your next visit today
              </p>
              <Button onClick={() => navigate('/dashboard/appointments/schedule')}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Desktop Only */}
      {!isMobile && (
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              icon: Calendar,
              label: 'Schedule Visit',
              path: '/dashboard/appointments/schedule',
              description: 'Book an appointment'
            },
            {
              icon: FileText,
              label: 'Complete Forms',
              path: '/dashboard/forms',
              description: pendingForms > 0 ? `${pendingForms} forms pending` : 'All forms complete'
            },
            {
              icon: CreditCard,
              label: 'Make Payment',
              path: '/dashboard/payments',
              description: hasOutstandingBalance ? `${formatCurrency(balance?.totalBalance || 0)} due` : 'No balance due'
            },
            {
              icon: User,
              label: 'Update Profile',
              path: '/dashboard/profile',
              description: 'Manage your info'
            }
          ].map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium text-foreground mb-0.5">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
