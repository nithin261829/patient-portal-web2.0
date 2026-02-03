// Date and Time Slot Picker Component
import { useState, useEffect } from 'react';
import { format, addMonths, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentStore } from '@/stores/appointment-store';
import { useAuthStore } from '@/stores/auth-store';
import { apiService } from '@/services/api';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DateSlotPicker() {
  const { patient } = useAuthStore();
  const {
    selectedType,
    selectedDate,
    selectedSlot,
    availableSlots,
    isLoadingSlots,
    setSelectedDate,
    setSelectedSlot,
    setAvailableSlots,
    setLoadingSlots,
  } = useAppointmentStore();

  const [minDate] = useState(new Date());
  const [maxDate] = useState(addMonths(new Date(), 6));

  useEffect(() => {
    if (selectedDate && selectedType) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, selectedType]);

  const loadSlots = async (date: Date) => {
    if (!selectedType || !patient) return;

    setLoadingSlots(true);
    try {
      const response = await apiService.appointments.getSlots({
        startDate: format(startOfDay(date), 'yyyy-MM-dd'),
        endDate: format(startOfDay(date), 'yyyy-MM-dd'),
        operatories: '',
        lengthInMinutes: selectedType.lengthInMinutes,
      });

      setAvailableSlots(response.data?.slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null); // Reset slot when date changes
    }
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'h:mm a');
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose a date for your appointment</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < minDate || date > maxDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Select Time</CardTitle>
          <CardDescription>
            {selectedDate
              ? `Available times for ${format(selectedDate, 'EEEE, MMMM d')}`
              : 'Choose a date to see available times'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedDate && (
            <div className="text-center text-muted-foreground py-8">
              Please select a date first
            </div>
          )}

          {selectedDate && isLoadingSlots && (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {selectedDate && !isLoadingSlots && availableSlots.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No available time slots for this date. Please choose another date.
            </div>
          )}

          {selectedDate && !isLoadingSlots && availableSlots.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 transition-all text-left',
                    'hover:border-primary/50 hover:shadow-sm',
                    selectedSlot === slot
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {formatTime(slot.appointmentDateTime)}
                      </span>
                    </div>
                    {slot.operatoryName && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {slot.operatoryName}
                      </Badge>
                    )}
                  </div>
                  {slot.providerName && (
                    <div className="text-sm text-muted-foreground mt-1 ml-7">
                      {slot.providerName}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
