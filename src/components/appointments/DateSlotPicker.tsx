// Enhanced Date and Time Slot Picker Component
// Based on Angular appointment-scheduler component
import { useState, useEffect, useMemo } from 'react';
import {
  format,
  addMonths,
  startOfDay,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addMinutes,
  isValid
} from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentStore } from '@/stores/appointment-store';
import { useAuthStore } from '@/stores/auth-store';
import { apiService } from '@/services/api';
import { slotCacheService } from '@/services/slot-cache';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupedSlots {
  [operatory: string]: any[];
}

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
    setOperatories: setOperatoriesStore,
  } = useAppointmentStore();

  const [minDate] = useState(new Date());
  const [maxDate] = useState(addMonths(new Date(), 6));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayedSlots, setDisplayedSlots] = useState<GroupedSlots>({});
  const [operatories, setOperatories] = useState<string>('');

  // Load operatories first, then slots
  useEffect(() => {
    if (selectedType) {
      loadOperatories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  // Load slots when operatories are ready or month changes
  useEffect(() => {
    if (selectedType && operatories) {
      console.log('[DateSlotPicker] Loading slots for month:', format(currentMonth, 'yyyy-MM'));
      loadSlotsForMonth(currentMonth);
    } else {
      console.log('[DateSlotPicker] Not loading slots:', {
        hasSelectedType: !!selectedType,
        hasOperatories: !!operatories,
        currentMonth: format(currentMonth, 'yyyy-MM')
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatories, currentMonth, selectedType]);

  // Update displayed slots when date is selected
  useEffect(() => {
    if (selectedDate && availableSlots.length > 0) {
      updateDisplayedSlots(selectedDate);
    }
  }, [selectedDate, availableSlots]);

  const loadOperatories = async () => {
    if (!selectedType) return;

    console.log('[DateSlotPicker] Loading operatories for:', selectedType.appointmentTypeName);

    try {
      const response = await apiService.appointments.getOperatories({
        appointmentTypeName: selectedType.appointmentTypeName,
      });

      console.log('[DateSlotPicker] Operatories response:', response.data);

      const fetchedOperatories = response.data?.operatories || [];

      if (fetchedOperatories.length === 0) {
        console.warn('[DateSlotPicker] No operatories found');
        toast.error('No operatories available for this appointment type');
        return;
      }

      // Store full operatory objects for later use (to extract providerNumber)
      setOperatoriesStore(fetchedOperatories); // Store in appointment store

      // Convert to comma-separated list of operatory numbers (matching Angular)
      const operatoryNumbers = fetchedOperatories
        .map((op: any) => op.operatoryNumber)
        .join(',');

      console.log('[DateSlotPicker] Operatories:', fetchedOperatories);
      console.log('[DateSlotPicker] Operatory numbers:', operatoryNumbers);

      setOperatories(operatoryNumbers);
    } catch (error: any) {
      console.error('[DateSlotPicker] Error loading operatories:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Failed to load operatories');
    }
  };

  const loadSlotsForMonth = async (month: Date) => {
    if (!selectedType || !patient || !operatories) {
      console.warn('[DateSlotPicker] Missing requirements:', {
        selectedType: !!selectedType,
        patient: !!patient,
        operatories: !!operatories
      });
      return;
    }

    const monthKey = format(startOfMonth(month), 'yyyy-MM');

    // Check cache first (cache key includes operatories - matching Angular)
    const cachedSlots = slotCacheService.getCachedSlots(monthKey, operatories);
    if (cachedSlots) {
      console.log('[DateSlotPicker] Using cached slots for', monthKey, ':', cachedSlots.length);
      setAvailableSlots(cachedSlots);
      return;
    }

    console.log('[DateSlotPicker] No cache found for', monthKey, ', fetching from API');

    setLoadingSlots(true);
    try {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const requestData = {
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd'),
        operatories: operatories, // Now uses actual operatory numbers
        lengthInMinutes: selectedType.lengthInMinutes,
      };

      console.log('[DateSlotPicker] Requesting slots:', requestData);

      const response = await apiService.appointments.getSlots(requestData);

      console.log('[DateSlotPicker] Slots response:', response.data);

      const slots = response.data?.slots || [];

      if (slots.length === 0) {
        console.warn('[DateSlotPicker] No slots returned from API');
        setAvailableSlots([]);
        toast.info('No available appointments for this month. Try another month.');
        return;
      }

      console.log('[DateSlotPicker] Raw slots count:', slots.length);
      console.log('[DateSlotPicker] First slot sample:', slots[0]);

      // Process slots to generate start times (30-minute intervals)
      const processedSlots = generateStartTimes(slots, selectedType.lengthInMinutes);

      console.log('[DateSlotPicker] Processed slots count:', processedSlots.length);
      if (processedSlots.length > 0) {
        console.log('[DateSlotPicker] First processed slot sample:', processedSlots[0]);

        // Count unique dates for debugging
        const uniqueDates = new Set(
          processedSlots.map(slot =>
            format(new Date(slot.appointmentDateTime), 'yyyy-MM-dd')
          )
        );
        console.log('[DateSlotPicker] Unique dates with slots:', uniqueDates.size);
        console.log('[DateSlotPicker] Date range:', Array.from(uniqueDates).sort().slice(0, 5), '...');
      }

      setAvailableSlots(processedSlots);
      slotCacheService.setCachedSlots(monthKey, operatories, processedSlots);
    } catch (error: any) {
      console.error('[DateSlotPicker] Error loading slots:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate 30-minute interval start times within each slot
  // Based on Angular generateStartTimes() method
  const generateStartTimes = (slots: any[], appointmentDuration: number): any[] => {
    const allSlots: any[] = [];

    slots.forEach((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      if (!isValid(slotStart) || !isValid(slotEnd)) return;

      // Generate 30-minute intervals
      let currentStart = slotStart;
      while (currentStart < slotEnd) {
        const potentialEnd = addMinutes(currentStart, appointmentDuration);

        // Check if appointment fits in this slot
        if (potentialEnd <= slotEnd) {
          // Handle different possible field names from API
          const operatoryNumber = slot.operatoryNumber || slot.operatory_number || slot.operatory;
          const providerNumber = slot.providerNumber || slot.provider_number || slot.provider;

          // Format datetime as 'yyyy-MM-dd HH:mm:ss' (matching Angular - keeps local timezone)
          const appointmentDateTime = format(currentStart, 'yyyy-MM-dd HH:mm:ss');

          allSlots.push({
            ...slot,
            appointmentDateTime: appointmentDateTime,
            start: currentStart,
            end: potentialEnd,
            operatoryName: slot.operatory || slot.operatoryName || `Room ${operatoryNumber || ''}`,
            operatoryNumber: operatoryNumber,
            providerNumber: providerNumber,
          });
        }

        // Move to next 30-minute interval
        currentStart = addMinutes(currentStart, 30);
      }
    });

    return allSlots;
  };

  const updateDisplayedSlots = (date: Date) => {
    // Filter slots for the selected date
    const slotsForDate = availableSlots.filter((slot) => {
      const slotDate = new Date(slot.appointmentDateTime);
      return isSameDay(startOfDay(slotDate), startOfDay(date));
    });

    // Group by operatory
    const grouped: GroupedSlots = {};
    slotsForDate.forEach((slot) => {
      const operatory = slot.operatoryName || 'Available';
      if (!grouped[operatory]) {
        grouped[operatory] = [];
      }
      grouped[operatory].push(slot);
    });

    setDisplayedSlots(grouped);

    // Auto-select first slot if none selected
    if (slotsForDate.length > 0 && !selectedSlot) {
      setSelectedSlot(slotsForDate[0]);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null); // Reset slot when date changes
    }
  };

  const handleMonthChange = (month: Date) => {
    console.log('[DateSlotPicker] Month changed to:', format(month, 'yyyy-MM'));

    // Clear current selection when changing months
    setSelectedDate(null);
    setSelectedSlot(null);
    setDisplayedSlots({});

    setCurrentMonth(month);
    // Note: useEffect will trigger loadSlotsForMonth when currentMonth updates
  };

  const handleSlotSelect = (slot: any) => {
    // Toggle selection - same as Angular
    if (selectedSlot === slot) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'h:mm a');
    } catch {
      return dateTimeStr;
    }
  };

  // Check if a date has available slots (for calendar highlighting)
  const hasAvailableSlots = (date: Date): boolean => {
    return availableSlots.some((slot) => {
      const slotDate = new Date(slot.appointmentDateTime);
      return isSameDay(startOfDay(slotDate), startOfDay(date));
    });
  };

  // Custom date class for calendar highlighting
  const modifiers = useMemo(() => ({
    available: (date: Date) => hasAvailableSlots(date),
  }), [availableSlots]);

  const modifiersClassNames = {
    available: 'border-2 border-primary bg-primary/5 font-semibold text-primary hover:bg-primary/15 hover:border-primary shadow-sm',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar with availability highlighting */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Select Date
          </CardTitle>
          <CardDescription className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded border-2 border-primary bg-primary/5"></span>
              Available dates
            </span>
            {selectedType && (
              <span className="text-xs text-muted-foreground ml-2">
                • {selectedType.lengthInMinutes} min appointment
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-muted/20 p-6">
          <div className="bg-background rounded-xl p-4 shadow-sm">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              disabled={(date) => date < minDate || date > maxDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="w-full"
            />
          </div>
          {isLoadingSlots && (
            <div className="text-center text-sm text-primary mt-3 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading available dates...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Slots grouped by Operatory */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Time
          </CardTitle>
          <CardDescription>
            {selectedDate
              ? `Available times for ${format(selectedDate, 'EEEE, MMMM d')}`
              : 'Choose a date to see available times'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!selectedDate && (
            <div className="text-center py-12 px-4 bg-muted/20 rounded-lg border-2 border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-base mb-2">Select a date first</p>
              <p className="text-sm text-muted-foreground">
                Choose a highlighted date from the calendar to view available time slots
              </p>
            </div>
          )}

          {selectedDate && isLoadingSlots && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          )}

          {selectedDate && !isLoadingSlots && Object.keys(displayedSlots).length === 0 && (
            <div className="text-center py-12 px-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <p className="font-semibold text-base mb-2 text-amber-900">This day is fully booked</p>
              <p className="text-sm text-amber-700 mb-4">
                All appointment slots are taken for {format(selectedDate, 'EEEE, MMMM d')}
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <p className="text-xs text-amber-600 font-medium">Try:</p>
                <ul className="text-xs text-left text-amber-700 space-y-1">
                  <li>• Selecting a different date (highlighted in purple)</li>
                  <li>• Checking next week's availability</li>
                  <li>• Calling the clinic for urgent appointments</li>
                </ul>
              </div>
            </div>
          )}

          {selectedDate && !isLoadingSlots && Object.keys(displayedSlots).length > 0 && (
            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(displayedSlots).map(([operatory, slots]) => (
                <div key={operatory} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                  {/* Operatory Header */}
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>{operatory}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {slots.length} available
                    </Badge>
                  </div>

                  {/* Time Slot Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotSelect(slot)}
                        className={cn(
                          'px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium',
                          'hover:scale-105 active:scale-95',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          selectedSlot === slot
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm'
                        )}
                      >
                        {formatTime(slot.appointmentDateTime)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
