import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { getInitials, formatPhone, formatDate } from '@/lib/utils'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string | undefined
  verified?: boolean
}

function InfoRow({ icon, label, value, verified }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">
          {value || 'Not provided'}
        </p>
      </div>
      {verified && (
        <Badge variant="success" className="shrink-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )}
    </div>
  )
}

export function ProfilePage() {
  const { patient, clientId, setPatient } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: patient?.firstName || '',
      lastName: patient?.lastName || '',
      email: patient?.email || '',
      phoneNumber: patient?.phoneNumber || '',
      street: patient?.address?.street || '',
      city: patient?.address?.city || '',
      state: patient?.address?.state || '',
      zipCode: patient?.address?.zipCode || '',
    }
  })

  useEffect(() => {
    if (patient) {
      reset({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || '',
        phoneNumber: patient.phoneNumber,
        street: patient.address?.street || '',
        city: patient.address?.city || '',
        state: patient.address?.state || '',
        zipCode: patient.address?.zipCode || '',
      })
    }
  }, [patient, reset])

  const onSubmit = async (data: ProfileFormData) => {
    if (!clientId || !patient?.patientId) return

    setIsSaving(true)
    try {
      await apiService.patient.updateProfile(clientId, patient.patientId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        }
      })

      // Update local state
      setPatient({
        ...patient,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
        }
      })

      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and preferences
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        {/* Cover/Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src="" alt={patientName} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(patientName)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{patientName}</h2>
              <p className="text-muted-foreground">Patient since {patient?.dateOfBirth ? '2024' : 'N/A'}</p>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              {isEditing ? (
                <form className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" required>First Name</Label>
                      <Input
                        id="firstName"
                        {...register('firstName')}
                        error={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-error">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" required>Last Name</Label>
                      <Input
                        id="lastName"
                        {...register('lastName')}
                        error={!!errors.lastName}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-error">{errors.lastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        error={!!errors.email}
                      />
                      {errors.email && (
                        <p className="text-sm text-error">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" required>Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        {...register('phoneNumber')}
                        error={!!errors.phoneNumber}
                      />
                      {errors.phoneNumber && (
                        <p className="text-sm text-error">{errors.phoneNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-4">Address</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input id="street" {...register('street')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register('city')} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input id="state" {...register('state')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input id="zipCode" {...register('zipCode')} />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow
                    icon={<User className="h-5 w-5 text-primary" />}
                    label="Full Name"
                    value={patientName}
                  />
                  <InfoRow
                    icon={<Calendar className="h-5 w-5 text-primary" />}
                    label="Date of Birth"
                    value={patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : undefined}
                  />
                  <InfoRow
                    icon={<Phone className="h-5 w-5 text-primary" />}
                    label="Phone Number"
                    value={patient?.phoneNumber ? formatPhone(patient.phoneNumber) : undefined}
                    verified
                  />
                  <InfoRow
                    icon={<Mail className="h-5 w-5 text-primary" />}
                    label="Email Address"
                    value={patient?.email}
                  />
                  <InfoRow
                    icon={<MapPin className="h-5 w-5 text-primary" />}
                    label="Address"
                    value={patient?.address ? `${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''} ${patient.address.zipCode || ''}` : undefined}
                  />
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="mt-6">
              <div className="space-y-6">
                <Alert variant="info">
                  <AlertDescription>
                    Keep your contact information up to date so we can send you appointment reminders and important updates.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Communication Preferences</CardTitle>
                    <CardDescription>Choose how you'd like to receive updates from us</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive appointment reminders via text</p>
                        </div>
                      </div>
                      <Checkbox defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates and newsletters</p>
                        </div>
                      </div>
                      <Checkbox />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notification Settings</CardTitle>
                  <CardDescription>Manage when and how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Appointment Reminders</p>
                        <p className="text-sm text-muted-foreground">24 hours before your appointment</p>
                      </div>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Payment Reminders</p>
                        <p className="text-sm text-muted-foreground">When you have an outstanding balance</p>
                      </div>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Security</CardTitle>
                  <CardDescription>Your account is secured with phone verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-success">Phone Number Verified</p>
                      <p className="text-sm text-muted-foreground">
                        Your phone number {patient?.phoneNumber ? formatPhone(patient.phoneNumber) : ''} is verified
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
