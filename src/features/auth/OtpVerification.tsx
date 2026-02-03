// OTP Verification Component
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { firebaseAuthService } from '@/services/firebase-auth';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface OtpVerificationProps {
  phoneNumber: string;
  onVerified: (idToken: string) => void;
  onBack: () => void;
  autoSend?: boolean;
}

export function OtpVerification({
  phoneNumber,
  onVerified,
  onBack,
  autoSend = true,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize reCAPTCHA and auto-send OTP
  useEffect(() => {
    firebaseAuthService.initializeRecaptcha('recaptcha-container', 'invisible');

    if (autoSend) {
      // Small delay to ensure reCAPTCHA is ready
      setTimeout(() => {
        sendOtp();
      }, 500);
    }

    return () => {
      firebaseAuthService.cleanup();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Focus OTP input when sent
  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [otpSent]);

  const startResendTimer = () => {
    setTimeLeft(60);
    setCanResend(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (isSending || !canResend && otpSent) return;

    setIsSending(true);
    setError(null);

    try {
      const formattedPhone = firebaseAuthService.formatPhoneNumber(phoneNumber);
      await firebaseAuthService.sendOtp(formattedPhone);
      setOtpSent(true);
      toast.success('Verification code sent to your phone');
      startResendTimer();
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await firebaseAuthService.verifyOtp(otp);
      toast.success('Verification successful');
      onVerified(idToken);
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);

      // Start resend timer on verification failure
      if (!canResend) {
        startResendTimer();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && otp.length === 6) {
      verifyOtp();
    }
  };

  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1})?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1] || '1'} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Verify Your Phone</h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-semibold">{formatPhoneForDisplay(phoneNumber)}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* OTP Input */}
      {otpSent && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              ref={otpInputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={handleOtpChange}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-semibold"
              disabled={isLoading}
            />
          </div>

          {/* Verify Button */}
          <Button
            onClick={verifyOtp}
            disabled={isLoading || otp.length !== 6}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            {!canResend ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-semibold text-primary">{timeLeft}s</span>
              </p>
            ) : (
              <Button
                onClick={sendOtp}
                disabled={isSending}
                variant="link"
                className="text-sm"
              >
                {isSending ? 'Sending...' : 'Resend verification code'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Send OTP Button (if not auto-sent or failed) */}
      {!otpSent && (
        <Button
          onClick={sendOtp}
          disabled={isSending}
          className="w-full"
          size="lg"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      )}

      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="w-full"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Login
      </Button>

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
