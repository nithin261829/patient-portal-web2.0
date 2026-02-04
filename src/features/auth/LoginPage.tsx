import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Phone, Calendar, ArrowRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { environment } from '@/config/environment'
import { OtpVerification } from './OtpVerification'

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9\-\(\)\s]+$/, 'Invalid phone number format'),
  dateOfBirth: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setPatient, clientId, orgId, clinic } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('')
  const [pendingPatientId, setPendingPatientId] = useState('')
  const [logoError, setLogoError] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: '',
      dateOfBirth: '',
    },
  })

  // Get logo URL with validation (using clinic data from auth store)
  const getLogoUrl = () => {
    if (logoError || !clinic?.logo_url) {
      return '/assets/assist-logo.png' // Fallback to TensorLinks logo
    }

    const trimmedUrl = clinic.logo_url.trim()
    if (
      trimmedUrl &&
      (trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('assets/') ||
        trimmedUrl.startsWith('/'))
    ) {
      return trimmedUrl
    }

    return '/assets/assist-logo.png' // Fallback
  }

  // Format phone number for API (+1XXXXXXXXXX)
  const formatPhoneForApi = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) {
      return '+1' + digits
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return '+' + digits
    }
    return '+1' + digits
  }

  const onSubmit = async (data: LoginFormData) => {
    if (!clientId) {
      toast.error('Missing clinic information')
      return
    }

    setIsLoading(true)
    try {
      // Format phone number
      const phoneNumber = formatPhoneForApi(data.phoneNumber)

      // Format DOB from MM/DD/YYYY to YYYY-MM-DD
      const [month, day, year] = data.dateOfBirth.split('/')
      const dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      // Step 1: Family lookup to find patient
      const lookupResponse = await apiService.patientLookup.familyLookup(clientId, {
        orgId: orgId,
        clientId: clientId,
        phoneNumber: phoneNumber,
        dob: dob,
      })

      const patients = lookupResponse.data

      if (!Array.isArray(patients) || patients.length === 0) {
        toast.error('No patient found with this information. Please check your details or register as a new patient.')
        return
      }

      // Handle multiple patients - could show selector dialog
      // For now, take the first patient (or we can implement PatientSelectorDialog later)
      const patient = patients[0]
      const patientId = patient.id

      // Store patient info for OTP step
      sessionStorage.setItem('pendingPatientId', patientId)
      sessionStorage.setItem('pendingPhoneNumber', phoneNumber)
      sessionStorage.setItem('pendingPatient', JSON.stringify(patient))

      // Set state for OTP verification
      setPendingPatientId(patientId)
      setPendingPhoneNumber(phoneNumber)
      setShowOtpVerification(true)

      toast.success(`Patient found: ${patient.firstName || 'Unknown'} ${patient.lastName || ''}`)

    } catch (error: any) {
      console.error('Login error:', error)
      let message = 'Unable to sign in. Please check your information.'

      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail.map((e: any) => e.msg || e.message).join(', ')
      }

      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  // Format DOB as user types
  const formatDOB = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
  }

  // Handle OTP verification success
  const handleOtpVerified = async (idToken: string) => {
    try {
      // Store Firebase ID token
      sessionStorage.setItem('idToken', idToken)

      // Exchange Firebase ID token for backend access token
      const response = await apiService.auth.exchangeToken({
        id_token: idToken,
        patient_id: pendingPatientId,
        client_id: clientId,
        org_id: orgId,
      })
      const { access_token, refresh_token } = response.data

      // Set tokens in auth store
      setToken(access_token, refresh_token)

      // Fetch and set patient data
      const patientResponse = await apiService.patient.getProfile(clientId, pendingPatientId)
      setPatient(patientResponse.data)

      toast.success('Successfully signed in!')

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Token exchange error:', error)
      toast.error('Failed to complete sign in. Please try again.')
      handleOtpBack()
    }
  }

  // Handle back from OTP verification
  const handleOtpBack = () => {
    setShowOtpVerification(false)
    setPendingPhoneNumber('')
    setPendingPatientId('')
    sessionStorage.removeItem('pendingPatientId')
    sessionStorage.removeItem('pendingPhoneNumber')
    sessionStorage.removeItem('pendingPatient')
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      {!showOtpVerification ? (
        <>
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
              Login to access your patient portal
            </CardDescription>
          </CardHeader>
          <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                className="pl-10"
                {...register('phoneNumber', {
                  onChange: (e) => {
                    e.target.value = formatPhoneNumber(e.target.value)
                  }
                })}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-error">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="dateOfBirth"
                type="text"
                placeholder="MM/DD/YYYY"
                className="pl-10"
                {...register('dateOfBirth', {
                  onChange: (e) => {
                    e.target.value = formatDOB(e.target.value)
                  }
                })}
              />
            </div>
            {errors.dateOfBirth && (
              <p className="text-sm text-error">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            New patient?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/signup')}>
              Schedule your first appointment
            </Button>
          </p>
        </div>

            {/* Dev info */}
            {!environment.production && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p><strong>Dev Mode</strong></p>
                <p>Tenant: {environment.tenantId}</p>
                <p>API: {environment.apiUrl}</p>
              </div>
            )}
          </CardContent>
        </>
      ) : (
        <CardContent className="pt-6">
          <OtpVerification
            phoneNumber={pendingPhoneNumber}
            onVerified={handleOtpVerified}
            onBack={handleOtpBack}
            autoSend={true}
          />
        </CardContent>
      )}
    </Card>
  )
}
