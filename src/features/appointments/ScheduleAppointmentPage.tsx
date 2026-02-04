// Schedule Appointment Page - Multi-step wizard with Agentic Search
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useAppointmentStore } from '@/stores/appointment-store';
import { apiService } from '@/services/api';
import { TreatmentDescriptionInput } from '@/components/appointments/TreatmentDescriptionInput';
import { DateSlotPicker } from '@/components/appointments/DateSlotPicker';
import { BookingConfirmation } from '@/components/appointments/BookingConfirmation';

type Step = 'description' | 'date-time' | 'confirm';

export function ScheduleAppointmentPage() {
  const navigate = useNavigate();
  const { clientId, orgId, patient } = useAuthStore();
  const {
    selectedType,
    selectedSlot,
    operatories,
    resetFlow,
    setAppointmentTypes,
    setLoadingTypes,
    isLoadingTypes,
    setSelectedType,
  } = useAppointmentStore();

  const [currentStep, setCurrentStep] = useState<Step>('description');
  const [isBooking, setIsBooking] = useState(false);
  const [hasTreatmentPlan, setHasTreatmentPlan] = useState(false);

  useEffect(() => {
    console.log('[ScheduleAppointment] Patient data:', patient);
    console.log('[ScheduleAppointment] ClientId:', clientId, 'OrgId:', orgId);

    // Check for treatment plans
    checkTreatmentPlans();

    return () => {
      // Reset flow when leaving
      resetFlow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTreatmentPlans = async () => {
    // TODO: Implement treatment plan check
    // For now, set to false
    setHasTreatmentPlan(false);
  };

  const handleDescriptionSubmit = async (description: string) => {
    setLoadingTypes(true);

    try {
      // Add "Existing Patient" prefix for better matching (like Angular)
      const prefixedDescription = `Existing Patient ${description}`;

      console.log('[AppointmentSchedule] Requesting types for:', prefixedDescription);

      const response = await apiService.appointments.getTypesByDescription({
        treatmentRequest: prefixedDescription,
        procedureCode: null,
        isPlannedTreatment: false,
      });

      console.log('[AppointmentSchedule] Response:', response);

      const types = response.data || [];

      if (!Array.isArray(types) || types.length === 0) {
        console.warn('[AppointmentSchedule] No types found:', types);
        toast.error('No matching appointment types found. Please try a different description.');
        setLoadingTypes(false);
        return;
      }

      setAppointmentTypes(types);

      // Angular behavior: Auto-select first matching type and go directly to date/time
      const firstType = types[0];
      console.log('[AppointmentSchedule] Auto-selected type:', firstType);

      setSelectedType(firstType);
      setCurrentStep('date-time'); // Skip the type selection step

      toast.success(`Found appointment: ${firstType.appointmentTypeName} (${firstType.lengthInMinutes} min)`);
    } catch (error: any) {
      console.error('[AppointmentSchedule] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.detail || 'Failed to find appointment types. Please try again.');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'date-time' && selectedSlot) {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'date-time') {
      // Go back to description and reset
      setCurrentStep('description');
      setSelectedType(null);
      setAppointmentTypes([]);
    } else if (currentStep === 'confirm') {
      setCurrentStep('date-time');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedType || !selectedSlot || !patient) {
      toast.error('Missing required information');
      return;
    }

    // Handle different possible field names for patient ID
    const patientId = (patient as any).patientId ||
                      (patient as any).patient_id ||
                      (patient as any).id ||
                      (patient as any).patientNumber;

    // Validate required fields
    if (!patientId) {
      toast.error('Patient ID is missing');
      console.error('[Booking] Missing patient ID. Patient object:', patient);
      return;
    }

    if (!selectedSlot.operatoryNumber) {
      toast.error('Operatory number is missing from selected slot');
      console.error('[Booking] Missing operatoryNumber in slot:', selectedSlot);
      return;
    }

    setIsBooking(true);
    try {
      // Extract provider number from operatory (matching Angular)
      const selectedOperatory = operatories.find(
        (op: any) => op.operatoryNumber === selectedSlot.operatoryNumber
      );
      const providerNumber = selectedSlot.providerNumber ||
                             selectedOperatory?.providerNumber ||
                             '1'; // Default fallback

      console.log('[Booking] Selected operatory:', selectedOperatory);
      console.log('[Booking] Provider number:', providerNumber);

      const bookingData: Record<string, unknown> = {
        clientId,
        orgId,
        patientId: patientId, // Use the extracted patientId
        appointmentDateTime: selectedSlot.appointmentDateTime,
        appointmentTypeNumber: selectedType.appointmentTypeNumber,
        operatoryNumber: selectedSlot.operatoryNumber,
        lengthInMinutes: selectedType.lengthInMinutes,
        providerNumber: providerNumber, // Always include providerNumber
        summary: selectedType.appointmentTypeName,
        isNewPatient: false,
        patientType: 'existing',
      };

      console.log('[Booking] Request data:', bookingData);
      console.log('[Booking] Selected slot:', selectedSlot);
      console.log('[Booking] Appointment datetime format:', {
        original: selectedSlot.appointmentDateTime,
        format: 'yyyy-MM-dd HH:mm:ss (local time)',
        note: 'This matches Angular format and preserves timezone'
      });

      await apiService.appointments.book(bookingData);

      toast.success('Appointment booked successfully!');
      navigate('/dashboard/appointments');
    } catch (error: any) {
      console.error('[Booking] Error:', error);
      console.error('[Booking] Error response:', error.response?.data);

      // Handle validation errors
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        const errors = error.response.data.detail.map((e: any) => e.msg).join(', ');
        toast.error(`Validation error: ${errors}`);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to book appointment');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 'date-time') return !!selectedSlot;
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'description':
        return (
          <TreatmentDescriptionInput
            onSubmit={handleDescriptionSubmit}
            isLoading={isLoadingTypes}
            hasTreatmentPlan={hasTreatmentPlan}
          />
        );
      case 'date-time':
        return (
          <>
            {/* Show selected type info */}
            {selectedType && (
              <Card className="mb-4 border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Appointment Type</p>
                      <p className="font-semibold text-lg">{selectedType.appointmentTypeName}</p>
                      <p className="text-sm text-muted-foreground">{selectedType.lengthInMinutes} minutes</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentStep('description');
                        setSelectedType(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <DateSlotPicker />
          </>
        );
      case 'confirm':
        return (
          <BookingConfirmation
            onConfirm={handleBookAppointment}
            isBooking={isBooking}
          />
        );
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'description':
        return <FileText className="w-4 h-4" />;
      case 'date-time':
        return <CalendarIcon className="w-4 h-4" />;
      case 'confirm':
        return <Check className="w-4 h-4" />;
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'description', label: 'Describe Need' },
    { id: 'date-time', label: 'Choose Date & Time' },
    { id: 'confirm', label: 'Confirm' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Appointment</h1>
          <p className="text-muted-foreground">Book your next visit in just a few steps</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/appointments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep === step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : steps.findIndex(s => s.id === currentStep) > index
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted text-muted-foreground'
                    }`}
                  >
                    {getStepIcon(step.id)}
                  </div>
                  <span className="text-sm font-medium mt-2">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      steps.findIndex(s => s.id === currentStep) > index
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation Buttons - Only show on date-time step */}
      {currentStep === 'date-time' && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
