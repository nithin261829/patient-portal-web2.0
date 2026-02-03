// Kiosk Setup Page - Configure device as kiosk
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Monitor, Lock, MapPin, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useKioskStore } from '@/stores/kiosk-store';
import { useAuthStore } from '@/stores/auth-store';

const kioskSetupSchema = z.object({
  deviceName: z.string().min(3, 'Device name must be at least 3 characters'),
  location: z.string().min(2, 'Location is required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must be 4 digits'),
  confirmPin: z.string(),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin'],
});

type KioskSetupFormData = z.infer<typeof kioskSetupSchema>;

export function KioskSetupPage() {
  const navigate = useNavigate();
  const { enableKioskMode } = useKioskStore();
  const { clientId } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KioskSetupFormData>({
    resolver: zodResolver(kioskSetupSchema),
  });

  const onSubmit = async (data: KioskSetupFormData) => {
    if (!clientId) {
      toast.error('Missing clinic information');
      return;
    }

    setIsLoading(true);
    try {
      // Generate unique device ID
      const deviceId = `kiosk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Enable kiosk mode
      enableKioskMode(
        {
          deviceId,
          deviceName: data.deviceName,
          location: data.location,
          isActive: true,
          lastActivity: new Date().toISOString(),
        },
        data.pin
      );

      toast.success('Kiosk mode enabled successfully!');
      navigate('/kiosk');
    } catch (error: any) {
      console.error('Kiosk setup failed:', error);
      toast.error('Failed to enable kiosk mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Kiosk Setup</CardTitle>
          <CardDescription>
            Configure this device for self-service patient check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Device Name */}
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <div className="relative">
                <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="deviceName"
                  className="pl-10"
                  placeholder="Front Desk Kiosk"
                  {...register('deviceName')}
                />
              </div>
              {errors.deviceName && (
                <p className="text-sm text-error">{errors.deviceName.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-10"
                  placeholder="Waiting Room"
                  {...register('location')}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-error">{errors.location.message}</p>
              )}
            </div>

            {/* Admin PIN */}
            <div className="space-y-2">
              <Label htmlFor="pin">Admin PIN (4 digits)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="pl-10"
                  placeholder="1234"
                  {...register('pin')}
                />
              </div>
              {errors.pin && (
                <p className="text-sm text-error">{errors.pin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This PIN will be required to exit kiosk mode
              </p>
            </div>

            {/* Confirm PIN */}
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  className="pl-10"
                  placeholder="1234"
                  {...register('confirmPin')}
                />
              </div>
              {errors.confirmPin && (
                <p className="text-sm text-error">{errors.confirmPin.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling Kiosk Mode...
                </>
              ) : (
                'Enable Kiosk Mode'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
