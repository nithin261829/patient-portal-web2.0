// Kiosk Check-In Page - Patient lookup and check-in flow
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Phone, Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useKioskStore } from '@/stores/kiosk-store';
import { useAuthStore } from '@/stores/auth-store';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { apiService } from '@/services/api';

export function KioskCheckInPage() {
  const navigate = useNavigate();
  const { resetKiosk, startCheckIn } = useKioskStore();
  const { clientId } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkInStep, setCheckInStep] = useState<'lookup' | 'confirm' | 'success'>('lookup');
  const [patientData, setPatientData] = useState<any>(null);

  // Idle timeout - reset to home
  useIdleTimeout(() => {
    resetKiosk();
    navigate('/kiosk');
  }, 5);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const formatDOB = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateOfBirth(formatDOB(e.target.value));
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('System error. Please contact staff.');
      return;
    }

    if (!phoneNumber || !dateOfBirth) {
      toast.error('Please enter both phone number and date of birth');
      return;
    }

    setIsLoading(true);
    try {
      // Format data for API
      const formattedPhone = '+1' + phoneNumber.replace(/\D/g, '');
      const [month, day, year] = dateOfBirth.split('/');
      const formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Look up patient
      const response = await apiService.patientLookup.familyLookup(clientId, {
        orgId: '',
        clientId,
        phoneNumber: formattedPhone,
        dob: formattedDOB,
      });

      if (response.data && response.data.length > 0) {
        setPatientData(response.data[0]);
        setCheckInStep('confirm');
      } else {
        toast.error('No appointment found. Please see the front desk.');
      }
    } catch (error: any) {
      console.error('Patient lookup failed:', error);
      toast.error('Patient not found. Please see the front desk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!patientData || !clientId) return;

    setIsLoading(true);
    try {
      // Start check-in session
      startCheckIn(patientData.patientId);

      // In real implementation, would call check-in API
      // await apiService.appointments.checkIn(clientId, appointmentId);

      setCheckInStep('success');

      // Auto-reset after 5 seconds
      setTimeout(() => {
        resetKiosk();
        navigate('/kiosk');
      }, 5000);
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed. Please see the front desk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetKiosk();
    navigate('/kiosk');
  };

  if (checkInStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-8">
        <Card className="max-w-lg w-full shadow-xl text-center p-12">
          <div className="space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Check-In Complete!</h2>
              <p className="text-xl text-muted-foreground">
                Welcome, {patientData?.firstName} {patientData?.lastName}
              </p>
            </div>
            <div className="space-y-2 text-lg">
              <p>Please have a seat in the waiting room.</p>
              <p className="text-muted-foreground">A staff member will call you shortly.</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Returning to home screen...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (checkInStep === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <Card className="max-w-lg w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Confirm Your Information</CardTitle>
            <CardDescription>Please verify this is correct</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-lg font-medium">
                  {patientData?.firstName} {patientData?.lastName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="text-lg font-medium">{dateOfBirth}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone Number</Label>
                <p className="text-lg font-medium">{phoneNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-14 text-lg"
                onClick={handleConfirmCheckIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  'Confirm Check-In'
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={() => setCheckInStep('lookup')}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Patient Check-In</CardTitle>
          <CardDescription>Enter your information to check in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="space-y-6">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-lg">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  className="pl-12 h-14 text-lg"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-lg">Date of Birth</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  id="dateOfBirth"
                  type="text"
                  inputMode="numeric"
                  className="pl-12 h-14 text-lg"
                  placeholder="MM/DD/YYYY"
                  value={dateOfBirth}
                  onChange={handleDOBChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Looking Up...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={handleCancel}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground pt-4">
              Need help? Please see the front desk staff.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
