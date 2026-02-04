import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { format, parse } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth-store'
import { useAppointmentStore } from '@/stores/appointment-store'
import { apiService } from '@/services/api'
import { DateSlotPicker } from '@/components/appointments/DateSlotPicker'
import type { Appointment } from '@/types'

export function RescheduleAppointmentPage() {
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { clientId, patient } = useAuthStore()
  const { selectedSlot, selectedType, setSelectedType, resetFlow } = useAppointmentStore()

  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRescheduling, setIsRescheduling] = useState(false)

  useEffect(() => {
    if (appointmentId) {
      loadAppointment()
    }

    return () => {
      resetFlow()
    }
  }, [appointmentId])

  const loadAppointment = async () => {
    const patientId =
      (patient as any)?.patientId ||
      (patient as any)?.patient_id ||
      (patient as any)?.id

    if (!clientId || !patientId || !appointmentId) {
      toast.error('Missing required information')
      navigate('/dashboard/appointments')
      return
    }

    setIsLoading(true)
    try {
      // Fetch current appointment details
      const response = await apiService.patient.getAppointments(clientId, patientId)
      const appointments = response.data || []
      const appointment = appointments.find(
        (apt: Appointment) => apt.appointmentNumber.toString() === appointmentId
      )

      if (!appointment) {
        toast.error('Appointment not found')
        navigate('/dashboard/appointments')
        return
      }

      setCurrentAppointment(appointment)

      // Set appointment type for slot loading
      if (appointment.appointmentTypeNumber && appointment.appointmentTypeName) {
        setSelectedType({
          appointmentTypeNumber: appointment.appointmentTypeNumber as number,
          appointmentTypeName: appointment.appointmentTypeName,
          lengthInMinutes: appointment.lengthInMinutes || 30,
        })
      }
    } catch (error: any) {
      console.error('[RescheduleAppointment] Error loading appointment:', error)
      toast.error('Failed to load appointment details')
      navigate('/dashboard/appointments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedSlot || !currentAppointment) {
      toast.error('Please select a new time slot')
      return
    }

    setIsRescheduling(true)
    try {
      await apiService.appointments.manage({
        appointmentNumber: currentAppointment.appointmentNumber,
        action: 'reschedule',
        appointmentDateTime: selectedSlot.appointmentDateTime,
        operatoryNumber: selectedSlot.operatoryNumber as number,
      })

      toast.success('Appointment rescheduled successfully!')
      navigate('/dashboard/appointments')
    } catch (error: any) {
      console.error('[RescheduleAppointment] Error:', error)
      toast.error(error.response?.data?.detail || 'Failed to reschedule appointment')
    } finally {
      setIsRescheduling(false)
    }
  }

  const parseAppointmentDate = (dateTimeStr: string): Date => {
    return dateTimeStr.includes('T')
      ? new Date(dateTimeStr)
      : parse(dateTimeStr, 'yyyy-MM-dd HH:mm:ss', new Date())
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reschedule Appointment</h1>
            <p className="text-muted-foreground">Loading appointment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentAppointment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Appointment not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentDate = parseAppointmentDate(currentAppointment.appointmentDateTime)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reschedule Appointment</h1>
            <p className="text-muted-foreground">Select a new date and time</p>
          </div>
        </div>
      </div>

      {/* Current Appointment Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Current Appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{currentAppointment.appointmentTypeName || 'General Appointment'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{currentAppointment.lengthInMinutes || 30} minutes</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Date</p>
              <p className="font-medium">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="font-medium">{format(currentDate, 'h:mm a')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date/Time Picker */}
      {selectedType && <DateSlotPicker />}

      {/* Action Buttons */}
      {selectedSlot && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">New appointment time:</p>
                <p className="font-semibold text-lg">
                  {format(
                    selectedSlot.appointmentDateTime.includes('T')
                      ? new Date(selectedSlot.appointmentDateTime)
                      : parse(selectedSlot.appointmentDateTime, 'yyyy-MM-dd HH:mm:ss', new Date()),
                    'EEEE, MMMM d, yyyy'
                  )}{' '}
                  at{' '}
                  {format(
                    selectedSlot.appointmentDateTime.includes('T')
                      ? new Date(selectedSlot.appointmentDateTime)
                      : parse(selectedSlot.appointmentDateTime, 'yyyy-MM-dd HH:mm:ss', new Date()),
                    'h:mm a'
                  )}
                </p>
              </div>
              <Button onClick={handleReschedule} disabled={isRescheduling} size="lg">
                {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedSlot && selectedType && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a new date and time from the calendar above</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
