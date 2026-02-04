// New Patient Signup Page - To be implemented in Phase 5
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function SignupPage() {
  const navigate = useNavigate();
  const { clinic } = useAuthStore();
  const [logoError, setLogoError] = useState(false);

  // Get logo URL with validation (using clinic data from auth store)
  const getLogoUrl = () => {
    if (logoError || !clinic?.logo_url) {
      return '/assets/assist-logo.png'; // Fallback to TensorLinks logo
    }

    const trimmedUrl = clinic.logo_url.trim();
    if (
      trimmedUrl &&
      (trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('assets/') ||
        trimmedUrl.startsWith('/'))
    ) {
      return trimmedUrl;
    }

    return '/assets/assist-logo.png';
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          {/* Clinic Logo and Name */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <img
              src={getLogoUrl()}
              alt="Clinic Logo"
              className="h-20 w-auto max-w-[200px] object-contain"
              onError={() => setLogoError(true)}
            />
            <h1 className="text-xl font-semibold text-foreground">
              {clinic?.displayName || 'Patient Portal'}
            </h1>
          </div>
          <CardDescription className="text-base">
            New Patient Registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              New patient registration flow will be implemented in Phase 5.
            </p>
            <p className="text-sm mt-2">
              This will include family lookup, patient creation, and initial form completion.
            </p>
          </div>

          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
