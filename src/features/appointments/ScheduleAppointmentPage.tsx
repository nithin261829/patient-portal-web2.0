// Schedule Appointment Page - Multi-step wizard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useAppointmentStore } from '@/stores/appointment-store';
import { apiService } from '@/services/api';
import { AppointmentTypeSelector } from '@/components/appointments/AppointmentTypeSelector';
import { DateSlotPicker } from '@/components/appointments/DateSlotPicker';
import { BookingConfirmation } from '@/components/appointments/BookingConfirmation';

type Step = 'type' | 'date-time' | 'confirm';

export function ScheduleAppointmentPage() {
  const navigate = useNavigate();
  const { clientId, orgId, patient } = useAuthStore();
  const {
    selectedType,
    selectedSlot,
    resetFlow,
    setAppointmentTypes,
    setLoadingTypes,
  } = useAppointmentStore();

  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    // Load appointment types on mount
    loadAppointmentTypes();

    return () => {
      // Reset flow when leaving
      resetFlow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointmentTypes = async () => {
    if (!patient) return;

    setLoadingTypes(true);
    try {
      const response = await apiService.appointments.getTypes();
      setAppointmentTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load appointment types:', error);
      toast.error('Failed to load appointment types');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'type' && selectedType) {
      setCurrentStep('date-time');
    } else if (currentStep === 'date-time' && selectedSlot) {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'date-time') {
      setCurrentStep('type');
    } else if (currentStep === 'confirm') {
      setCurrentStep('date-time');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedType || !selectedSlot || !patient) {
      toast.error('Missing required information');
      return;
    }

    setIsBooking(true);
    try {
      await apiService.appointments.book({
        clientId,
        orgId,
        patientId: patient.patientId,
        appointmentDateTime: selectedSlot.appointmentDateTime,
        appointmentTypeNumber: selectedType.appointmentTypeNumber,
        operatoryNumber: selectedSlot.operatoryNumber,
        lengthInMinutes: selectedType.lengthInMinutes,
        summary: selectedType.appointmentTypeName,
        isNewPatient: false,
        patientType: 'existing',
      });

      toast.success('Appointment booked successfully!');
      navigate('/dashboard/appointments');
    } catch (error: any) {
      console.error('Failed to book appointment:', error);
      toast.error(error.response?.data?.detail || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 'type') return !!selectedType;
    if (currentStep === 'date-time') return !!selectedSlot;
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return <AppointmentTypeSelector />;
      case 'date-time':
        return <DateSlotPicker />;
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
      case 'type':
        return <User className="w-4 h-4" />;
      case 'date-time':
        return <CalendarIcon className="w-4 h-4" />;
      case 'confirm':
        return <Check className="w-4 h-4" />;
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'type', label: 'Select Type' },
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

      {/* Navigation Buttons */}
      {currentStep !== 'confirm' && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 'type'}
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
