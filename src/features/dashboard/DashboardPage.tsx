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
import { ClinicInfo } from '@/components/clinic/ClinicInfo'
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
      console.log('Dashboard: Checking auth data...', { clientId, patientId: patient?.patientId })

      if (!clientId || !patient?.patientId) {
        console.warn('Dashboard: Missing clientId or patientId')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        console.log('Dashboard: Fetching appointments...')
        const appointmentsRes = await apiService.patient.getAppointments(clientId, patient.patientId)
        console.log('Dashboard: Appointments response:', appointmentsRes)
        const now = new Date()
        const upcoming = (appointmentsRes.data || [])
          .filter((apt: Appointment) => new Date(apt.appointmentDateTime) > now)
          .sort((a: Appointment, b: Appointment) =>
            new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime()
          )
          .slice(0, 3)
        setUpcomingAppointments(upcoming)

        console.log('Dashboard: Fetching balance...')
        const balanceRes = await apiService.patient.getAgingBalance(clientId, patient.patientId)
        console.log('Dashboard: Balance response:', balanceRes)
        setBalance(balanceRes.data)

        console.log('Dashboard: Fetching forms...')
        const formsRes = await apiService.forms.getAllForms(clientId, patient.patientId)
        console.log('Dashboard: Forms response:', formsRes)
        const pending = (formsRes.data || []).filter((f: { status?: string }) => f.status === 'draft' || f.status === 'pending').length
        setPendingForms(pending)
      } catch (error) {
        console.error('Dashboard: Error fetching data:', error)
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

      {/* Main Content Grid */}
      <div className={cn(
        "grid gap-4",
        !isMobile && "grid-cols-3"
      )}>
        {/* Left Column - Appointments and Account Summary */}
        <div className={cn("space-y-4", !isMobile && "col-span-2")}>
          {/* Account Summary Card */}
          <Card>
            <CardContent className="p-0">
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between border-b border-border",
                isMobile ? "px-4 py-3" : "px-5 py-4"
              )}>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    Account Summary
                  </h2>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/payments" className="text-primary">
                    View details <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Balance Overview */}
              <div className={cn(isMobile ? "p-4" : "p-6")}>
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Your Current Balance</p>
                  <p className={cn(
                    "font-bold",
                    isMobile ? "text-2xl" : "text-3xl",
                    hasOutstandingBalance ? "text-primary" : "text-success"
                  )}>
                    {formatCurrency(balance?.PatEstBal ?? balance?.totalBalance ?? 0)}
                  </p>
                  {hasOutstandingBalance && balance && (balance.Total ?? 0) > 0 && (
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={() => navigate('/dashboard/payments/new')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                  )}
                  {(!hasOutstandingBalance || (balance && (balance.Total ?? 0) <= 0)) && (
                    <div className="flex items-center gap-2 mt-2 text-success">
                      <Badge variant="success" className="text-xs">
                        Paid in Full
                      </Badge>
                      <span className="text-xs">Thank you!</span>
                    </div>
                  )}
                </div>

                {/* Balance Breakdown */}
                {balance && (balance.Total !== undefined || balance.InsEst !== undefined) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground mb-3">Balance Breakdown</p>
                    <div className="space-y-1.5 text-sm">
                      {balance.Total !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Charges</span>
                          <span className="font-medium">{formatCurrency(balance.Total)}</span>
                        </div>
                      )}
                      {balance.InsEst !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Insurance Estimate</span>
                          <span className="font-medium">{formatCurrency(balance.InsEst)}</span>
                        </div>
                      )}
                      {balance.PatEstBal !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Patient Responsibility</span>
                          <span className="font-medium text-primary">{formatCurrency(balance.PatEstBal)}</span>
                        </div>
                      )}

                      {/* Aging Buckets */}
                      {(balance.Bal_0_30 !== undefined || balance.Bal_31_60 !== undefined) && (
                        <>
                          <div className="border-t pt-2 mt-2" />
                          <p className="text-xs font-medium text-muted-foreground mb-1">Aging</p>
                          {balance.Bal_0_30 !== undefined && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">0-30 Days</span>
                              <span>{formatCurrency(balance.Bal_0_30)}</span>
                            </div>
                          )}
                          {balance.Bal_31_60 !== undefined && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">31-60 Days</span>
                              <span>{formatCurrency(balance.Bal_31_60)}</span>
                            </div>
                          )}
                          {balance.Bal_61_90 !== undefined && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">61-90 Days</span>
                              <span>{formatCurrency(balance.Bal_61_90)}</span>
                            </div>
                          )}
                          {balance.BalOver90 !== undefined && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Over 90 Days</span>
                              <span>{formatCurrency(balance.BalOver90)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
        </div>

        {/* Right Column - Clinic Info */}
        <ClinicInfo />
      </div>

    </div>
  )
}
