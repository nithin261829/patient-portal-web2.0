// Kiosk PIN Dialog - Admin authentication to exit kiosk mode
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKioskStore } from '@/stores/kiosk-store';

interface KioskPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KioskPinDialog({ open, onOpenChange }: KioskPinDialogProps) {
  const navigate = useNavigate();
  const { kioskPin, disableKioskMode } = useKioskStore();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin === kioskPin) {
      // Correct PIN - disable kiosk mode
      disableKioskMode();
      toast.success('Kiosk mode disabled');
      navigate('/dashboard');
    } else {
      // Incorrect PIN
      setAttempts((prev) => prev + 1);
      setPin('');
      toast.error('Incorrect PIN');

      // Lock after 3 failed attempts
      if (attempts >= 2) {
        toast.error('Too many failed attempts. Contact administrator.');
        onOpenChange(false);
        setAttempts(0);
      }
    }
  };

  const handleClose = () => {
    setPin('');
    setAttempts(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Access
          </DialogTitle>
          <DialogDescription>
            Enter the admin PIN to exit kiosk mode
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-pin">Admin PIN</Label>
            <Input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            {attempts > 0 && (
              <p className="text-sm text-error">
                Incorrect PIN. {3 - attempts} attempts remaining.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={pin.length !== 4}>
              Exit Kiosk Mode
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
