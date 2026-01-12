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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { environment } from '@/config/environment'

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
  const { setToken, setPatient, clientId, orgId } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

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

      // Get the first matching patient (or could show selector if multiple)
      const patient = patients[0]
      const patientId = patient.id

      // Store patient info for OTP step
      sessionStorage.setItem('pendingPatientId', patientId)
      sessionStorage.setItem('pendingPhoneNumber', phoneNumber)
      sessionStorage.setItem('pendingPatient', JSON.stringify(patient))

      // TODO: Implement Firebase OTP flow
      // For now, show message that OTP verification is needed
      toast.success(`Patient found: ${patient.firstName || 'Unknown'} ${patient.lastName || ''}`)
      toast.info('OTP verification is required to continue. (OTP flow not yet implemented)')

      // Navigate to OTP page (to be implemented)
      // navigate('/verify-otp')

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

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">P</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your patient portal
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
    </Card>
  )
}
