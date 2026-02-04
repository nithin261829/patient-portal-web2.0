import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, startOfWeek, endOfWeek, isSameMonth } from 'date-fns'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SkeletonCard } from '@/components/ui/skeleton'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Appointment } from '@/types'

type ViewMode = 'list' | 'calendar'
type FilterTab = 'upcoming' | 'planned' | 'past' | 'all'

// Helper to parse appointment datetime consistently (matching Angular format)
const parseAppointmentDate = (dateTimeStr: string): Date => {
  // Check if it's ISO format (with T) or local format (yyyy-MM-dd HH:mm:ss)
  return dateTimeStr.includes('T')
    ? new Date(dateTimeStr) // ISO format (legacy)
    : parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date()) // Local format (matching Angular)
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { patient, clientId, isAuthenticated, isTokenExpired, accessToken } = useAuthStore()
  const isMobile = useIsMobile()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterTab, setFilterTab] = useState<FilterTab>('upcoming')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, patient])

  const fetchAppointments = async () => {
    // Log auth status for debugging (but don't block)
    console.log('[AppointmentsPage] Auth status:', {
      isAuthenticated,
      hasToken: !!accessToken,
      isExpired: isTokenExpired?.() || false,
    })

    // Handle different possible field names for patient ID
    const patientId = (patient as any)?.patientId ||
                      (patient as any)?.patient_id ||
                      (patient as any)?.id ||
                      (patient as any)?.patientNumber

    if (!clientId || !patientId) {
      console.warn('[AppointmentsPage] Missing clientId or patientId:', { clientId, patient })
      return
    }

    setIsLoading(true)
    try {
      console.log('[AppointmentsPage] Fetching appointments for patient:', patientId)
      const response = await apiService.patient.getAppointments(clientId, patientId)
      const appointmentsList = response.data || []

      console.log('[AppointmentsPage] Fetched appointments:', appointmentsList.length)
      if (appointmentsList.length > 0) {
        console.log('[AppointmentsPage] Sample appointment:', appointmentsList[0])
      }

      setAppointments(appointmentsList)
    } catch (error: any) {
      console.error('[AppointmentsPage] Error fetching appointments:', error)

      // Check for signature verification failure
      if (error.response?.data?.detail?.includes('Signature verification failed')) {
        console.error('[AppointmentsPage] Token signature verification failed - token is invalid')
        toast.error('Session expired. Please log in again.', {
          action: {
            label: 'Clear & Login',
            onClick: () => {
              if (typeof window !== 'undefined' && (window as any).clearAuth) {
                (window as any).clearAuth()
              } else {
                navigate('/login')
              }
            },
          },
        })
      } else {
        toast.error('Failed to load appointments')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Categorize appointments (matching Angular logic)
  const now = new Date()
  const isCompleted = (status: string) => {
    const lowerStatus = status?.toLowerCase() || ''
    return lowerStatus === 'completed' || lowerStatus === 'complete'
  }
  const isPlanned = (status: string) => {
    const lowerStatus = status?.toLowerCase() || ''
    return lowerStatus === 'planned'
  }

  // Upcoming: future date AND not completed
  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = parseAppointmentDate(apt.appointmentDateTime)
    return aptDate >= now && !isCompleted(apt.appointmentStatus)
  }).sort((a, b) => parseAppointmentDate(a.appointmentDateTime).getTime() - parseAppointmentDate(b.appointmentDateTime).getTime())

  // Planned: appointments that need to be scheduled
  const plannedAppointments = appointments.filter((apt) =>
    isPlanned(apt.appointmentStatus)
  ).sort((a, b) => parseAppointmentDate(a.appointmentDateTime).getTime() - parseAppointmentDate(b.appointmentDateTime).getTime())

  // Past: past date OR completed status
  const pastAppointments = appointments.filter((apt) => {
    const aptDate = parseAppointmentDate(apt.appointmentDateTime)
    return aptDate < now || isCompleted(apt.appointmentStatus)
  }).sort((a, b) => parseAppointmentDate(b.appointmentDateTime).getTime() - parseAppointmentDate(a.appointmentDateTime).getTime())

  // Filter based on selected tab
  const filteredAppointments = (() => {
    switch (filterTab) {
      case 'upcoming':
        return upcomingAppointments
      case 'planned':
        return plannedAppointments
      case 'past':
        return pastAppointments
      case 'all':
        return [...upcomingAppointments, ...plannedAppointments, ...pastAppointments]
      default:
        return appointments
    }
  })()

  // Calendar helpers - show complete weeks (6 weeks total)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseAppointmentDate(apt.appointmentDateTime), day)
    )
  }

  // Actions
  const handleConfirm = async (appointmentId: string | number) => {
    try {
      await apiService.appointments.manage({
        appointmentNumber: appointmentId,
        action: 'confirm'
      })
      toast.success('Appointment confirmed!')
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to confirm appointment')
    }
  }

  const handleCancelClick = (appointmentId: string | number) => {
    const apt = appointments.find((a) => a.appointmentNumber === appointmentId)
    if (apt) {
      setAppointmentToCancel(apt)
      setCancelDialogOpen(true)
    }
  }

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return

    setIsCancelling(true)
    try {
      await apiService.appointments.manage({
        appointmentNumber: appointmentToCancel.appointmentNumber,
        action: 'cancel'
      })
      toast.success('Appointment cancelled')
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)
      fetchAppointments()
    } catch (error) {
      toast.error('Failed to cancel appointment')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleReschedule = (appointmentId: string | number) => {
    navigate(`/dashboard/appointments/${appointmentId}/reschedule`)
  }

  const handleViewDetails = (appointmentId: string | number) => {
    navigate(`/dashboard/appointments/${appointmentId}`)
  }

  const upcomingCount = upcomingAppointments.length
  const plannedCount = plannedAppointments.length
  const pastCount = pastAppointments.length

  // Debug logging
  useEffect(() => {
    if (appointments.length > 0) {
      console.log('[AppointmentsPage] Categorization:', {
        total: appointments.length,
        upcoming: upcomingCount,
        planned: plannedCount,
        past: pastCount
      })
    }
  }, [appointments.length, upcomingCount, plannedCount, pastCount])

  return (
    <div className={cn("space-y-4", !isMobile && "space-y-6")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            Appointments
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground text-sm mt-1">
              Manage your visits
            </p>
          )}
        </div>
        <Button
          size={isMobile ? "sm" : "default"}
          onClick={() => navigate('/dashboard/appointments/schedule')}
        >
          <Plus className="h-4 w-4 mr-1" />
          {isMobile ? 'New' : 'Schedule'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as FilterTab)}
        >
          <TabsList className={cn(isMobile ? "grid grid-cols-4" : "")}>
            <TabsTrigger value="upcoming" className={cn(isMobile && "text-xs")}>
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {upcomingCount}
                </Badge>
              )}
            </TabsTrigger>
            {plannedCount > 0 && (
              <TabsTrigger value="planned" className={cn(isMobile && "text-xs")}>
                Planned
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {plannedCount}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="past" className={cn(isMobile && "text-xs")}>
              Past
              {pastCount > 0 && !isMobile && (
                <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">
                  {pastCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className={cn(isMobile && "text-xs")}>All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* View toggle - desktop only */}
        {!isMobile && (
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('calendar')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className={cn("text-center", isMobile ? "py-10" : "py-16")}>
            <Calendar className={cn(
              "mx-auto text-muted-foreground mb-3",
              isMobile ? "h-10 w-10" : "h-12 w-12"
            )} />
            <h3 className={cn(
              "font-medium text-foreground mb-1",
              isMobile ? "text-base" : "text-lg"
            )}>
              No appointments
            </h3>
            <p className={cn(
              "text-muted-foreground mb-4",
              isMobile && "text-sm"
            )}>
              {filterTab === 'upcoming' && 'Schedule your next visit'}
              {filterTab === 'planned' && 'No planned appointments'}
              {filterTab === 'past' && 'No past appointments'}
              {filterTab === 'all' && 'No appointments found'}
            </p>
            {(filterTab === 'upcoming' || filterTab === 'planned') && (
              <Button onClick={() => navigate('/dashboard/appointments/schedule')}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'list' || isMobile ? (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.appointmentNumber}
              appointment={appointment}
              variant="compact"
              onConfirm={handleConfirm}
              onCancel={handleCancelClick}
              onReschedule={handleReschedule}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        /* Calendar View - Desktop only */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day)
                const hasAppointments = dayAppointments.length > 0
                const isPastDay = isPast(day) && !isToday(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "aspect-square p-1 rounded-lg border border-transparent transition-colors",
                      isToday(day) && "bg-primary/10 border-primary/30",
                      hasAppointments && !isToday(day) && "bg-muted/50",
                      isPastDay && "opacity-50",
                      !isCurrentMonth && "opacity-30"
                    )}
                  >
                    <div className="h-full flex flex-col">
                      <span className={cn(
                        "text-sm font-medium",
                        isToday(day) && "text-primary",
                        !isCurrentMonth && "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {hasAppointments && isCurrentMonth && (
                        <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <div
                              key={apt.appointmentNumber}
                              className="text-xs px-1 py-0.5 rounded bg-primary/20 text-primary truncate cursor-pointer hover:bg-primary/30"
                              onClick={() => handleViewDetails(apt.appointmentNumber)}
                              title={apt.appointmentTypeName}
                            >
                              {format(parseAppointmentDate(apt.appointmentDateTime), 'h:mm a')}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{dayAppointments.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className={cn(isMobile && "w-[calc(100%-2rem)] rounded-xl")}>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure? This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {appointmentToCancel && (
            <div className="py-3">
              <div className={cn(
                "rounded-lg bg-muted/50 p-3 space-y-1",
                !isMobile && "p-4 space-y-2"
              )}>
                <p className={cn("font-medium", isMobile && "text-sm")}>
                  {appointmentToCancel.appointmentTypeName || 'Appointment'}
                </p>
                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
                  {format(parseAppointmentDate(appointmentToCancel.appointmentDateTime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
                  {format(parseAppointmentDate(appointmentToCancel.appointmentDateTime), 'h:mm a')}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className={cn(isMobile && "flex-col gap-2")}>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
              className={cn(isMobile && "w-full")}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              loading={isCancelling}
              className={cn(isMobile && "w-full")}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
