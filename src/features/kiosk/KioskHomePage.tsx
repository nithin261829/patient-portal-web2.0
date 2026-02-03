// Kiosk Home Page - Self-service check-in start screen
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UserPlus, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useKioskStore } from '@/stores/kiosk-store';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { KioskPinDialog } from './KioskPinDialog';

export function KioskHomePage() {
  const navigate = useNavigate();
  const { kioskDevice, resetKiosk, isKioskMode } = useKioskStore();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Redirect if not in kiosk mode
  useEffect(() => {
    if (!isKioskMode) {
      navigate('/kiosk/setup');
    }
  }, [isKioskMode, navigate]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle timeout - reset to home
  useIdleTimeout(() => {
    resetKiosk();
  }, 5);

  const handleStartCheckIn = () => {
    navigate('/kiosk/check-in');
  };

  const handleAdminAccess = () => {
    setShowPinDialog(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Patient Check-In</h1>
            <p className="text-sm text-muted-foreground">{kioskDevice?.location}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminAccess}
            className="text-muted-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Time Display */}
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-primary">{formatTime(currentTime)}</div>
            <div className="text-xl text-muted-foreground">{formatDate(currentTime)}</div>
          </div>

          {/* Welcome Card */}
          <Card className="p-12 text-center shadow-xl bg-white/80 backdrop-blur">
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-3">Welcome!</h2>
                <p className="text-xl text-muted-foreground">
                  Please check in for your appointment
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-20 text-2xl"
                onClick={handleStartCheckIn}
              >
                <UserPlus className="mr-3 h-8 w-8" />
                Start Check-In
              </Button>
            </div>
          </Card>

          {/* Instructions */}
          <div className="text-center space-y-2 text-muted-foreground">
            <p className="text-lg">
              Touch the button above to begin your check-in process
            </p>
            <p className="text-sm">
              If you need assistance, please see the front desk
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-4">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Device: {kioskDevice?.deviceName}
        </div>
      </div>

      {/* Admin PIN Dialog */}
      <KioskPinDialog open={showPinDialog} onOpenChange={setShowPinDialog} />
    </div>
  );
}
