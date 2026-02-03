// Appointment Type Selector Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentStore } from '@/stores/appointment-store';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppointmentTypeSelector() {
  const {
    appointmentTypes,
    selectedType,
    isLoadingTypes,
    setSelectedType,
  } = useAppointmentStore();

  if (isLoadingTypes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Appointment Type</CardTitle>
          <CardDescription>Choose the type of appointment you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (appointmentTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Appointment Type</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No appointment types available. Please contact the clinic.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Appointment Type</CardTitle>
        <CardDescription>Choose the type of appointment you need</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointmentTypes.map((type) => (
          <button
            key={type.appointmentTypeNumber}
            onClick={() => setSelectedType(type)}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all text-left',
              'hover:border-primary/50 hover:shadow-sm',
              selectedType?.appointmentTypeNumber === type.appointmentTypeNumber
                ? 'border-primary bg-primary/5'
                : 'border-border'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{type.appointmentTypeName}</h3>
                  {selectedType?.appointmentTypeNumber === type.appointmentTypeNumber && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{type.lengthInMinutes} minutes</span>
                </div>
              </div>
              {type.category && (
                <Badge variant="secondary">{type.category}</Badge>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
