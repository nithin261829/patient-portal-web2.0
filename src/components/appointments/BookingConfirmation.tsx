// Booking Confirmation Component
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppointmentStore } from '@/stores/appointment-store';
import { useAuthStore } from '@/stores/auth-store';
import { Calendar, Clock, User, MapPin, FileText, Loader2 } from 'lucide-react';

interface BookingConfirmationProps {
  onConfirm: () => void;
  isBooking: boolean;
}

export function BookingConfirmation({ onConfirm, isBooking }: BookingConfirmationProps) {
  const { patient } = useAuthStore();
  const { selectedType, selectedSlot, selectedDate } = useAppointmentStore();

  if (!selectedType || !selectedSlot || !selectedDate) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Missing appointment information
        </CardContent>
      </Card>
    );
  }

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'h:mm a');
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Your Appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appointment Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Appointment Type</p>
              <p className="font-semibold">{selectedType.appointmentTypeName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-semibold">{formatTime(selectedSlot.appointmentDateTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Duration: {selectedType.lengthInMinutes} minutes
              </p>
            </div>
          </div>

          {selectedSlot.operatoryName && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{selectedSlot.operatoryName}</p>
                {selectedSlot.providerName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    with {selectedSlot.providerName}
                  </p>
                )}
              </div>
            </div>
          )}

          {patient && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Important Notes */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Important Information</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Please arrive 10-15 minutes early</li>
            <li>Bring your insurance card and ID</li>
            <li>If you need to cancel, please do so at least 24 hours in advance</li>
          </ul>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={onConfirm}
          disabled={isBooking}
          className="w-full"
          size="lg"
        >
          {isBooking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking Appointment...
            </>
          ) : (
            'Confirm Appointment'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
