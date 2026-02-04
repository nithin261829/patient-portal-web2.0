// Appointment Type Selector Component - Dropdown Version
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentStore } from '@/stores/appointment-store';
import { Clock, Calendar } from 'lucide-react';

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
          <CardDescription>We found matching appointment types for your need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (appointmentTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Matching Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No appointment types found. Please try a different description or contact the clinic.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleValueChange = (value: string) => {
    const type = appointmentTypes.find(t => t.appointmentTypeNumber.toString() === value);
    if (type) {
      setSelectedType(type);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Appointment Type</CardTitle>
        <CardDescription>
          We found {appointmentTypes.length} matching appointment type{appointmentTypes.length > 1 ? 's' : ''} for your need
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedType?.appointmentTypeNumber?.toString()}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="w-full h-12">
            <SelectValue placeholder="Choose an appointment type..." />
          </SelectTrigger>
          <SelectContent>
            {appointmentTypes.map((type) => (
              <SelectItem
                key={type.appointmentTypeNumber}
                value={type.appointmentTypeNumber.toString()}
                className="py-3"
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <span className="font-medium">{type.appointmentTypeName}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {type.lengthInMinutes} min
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Type Details */}
        {selectedType && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-base">{selectedType.appointmentTypeName}</h4>
                {selectedType.description && (
                  <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                )}
              </div>
              {selectedType.category && (
                <Badge variant="secondary">{selectedType.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{selectedType.lengthInMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Appointment duration</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
