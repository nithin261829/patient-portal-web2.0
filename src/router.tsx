import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Auth Pages
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { NewPatientPage } from '@/features/auth/NewPatientPage'

// Dashboard Pages
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage'
import { ScheduleAppointmentPage } from '@/features/appointments/ScheduleAppointmentPage'
import { RescheduleAppointmentPage } from '@/features/appointments/RescheduleAppointmentPage'
import { FormsPage } from '@/features/forms/FormsPage'
import { DynamicFormPage } from '@/features/forms/DynamicFormPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { PaymentDetailsPage } from '@/features/payments/PaymentDetailsPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { InsurancePage } from '@/features/insurance/InsurancePage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

// Kiosk Pages
import { KioskSetupPage } from '@/features/kiosk/KioskSetupPage'
import { KioskHomePage } from '@/features/kiosk/KioskHomePage'
import { KioskCheckInPage } from '@/features/kiosk/KioskCheckInPage'

// Placeholder components for routes not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground max-w-md">
      This page is coming soon. We're working hard to bring you the best experience.
    </p>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      {
        path: '/new-patient',
        element: <NewPatientPage />,
      },
      {
        path: '/forgot-password',
        element: <PlaceholderPage title="Forgot Password" />,
      },
    ],
  },

  // Kiosk Routes
  {
    path: '/kiosk/setup',
    element: <KioskSetupPage />,
  },
  {
    path: '/kiosk',
    element: <KioskHomePage />,
  },
  {
    path: '/kiosk/check-in',
    element: <KioskCheckInPage />,
  },

  // Dashboard Routes (Protected)
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      // Appointments
      {
        path: '/dashboard/appointments',
        element: <AppointmentsPage />,
      },
      {
        path: '/dashboard/appointments/schedule',
        element: <ScheduleAppointmentPage />,
      },
      {
        path: '/dashboard/appointments/:appointmentId',
        element: <PlaceholderPage title="Appointment Details" />,
      },
      {
        path: '/dashboard/appointments/:appointmentId/reschedule',
        element: <RescheduleAppointmentPage />,
      },
      // Forms
      {
        path: '/dashboard/forms',
        element: <FormsPage />,
      },
      {
        path: '/dashboard/forms/:formId',
        element: <DynamicFormPage />,
      },
      {
        path: '/dashboard/forms/:formId/view',
        element: <PlaceholderPage title="View Form Submission" />,
      },
      // Payments
      {
        path: '/dashboard/payments',
        element: <PaymentsPage />,
      },
      {
        path: '/dashboard/payments/new',
        element: <PaymentDetailsPage />,
      },
      {
        path: '/dashboard/payments/:paymentId',
        element: <PlaceholderPage title="Payment Details" />,
      },
      // Profile
      {
        path: '/dashboard/profile',
        element: <ProfilePage />,
      },
      // Documents
      {
        path: '/dashboard/documents',
        element: <DocumentsPage />,
      },
      // Notifications
      {
        path: '/dashboard/notifications',
        element: <NotificationsPage />,
      },
      // Insurance
      {
        path: '/dashboard/insurance',
        element: <InsurancePage />,
      },
      // Settings
      {
        path: '/dashboard/settings',
        element: <SettingsPage />,
      },
      // Documents
      {
        path: '/dashboard/documents',
        element: <PlaceholderPage title="My Documents" />,
      },
      // Notifications
      {
        path: '/dashboard/notifications',
        element: <PlaceholderPage title="Notifications" />,
      },
      // Insurance
      {
        path: '/dashboard/insurance',
        element: <PlaceholderPage title="Insurance Information" />,
      },
      // Settings
      {
        path: '/dashboard/settings',
        element: <PlaceholderPage title="Settings" />,
      },
    ],
  },

  // Catch all - 404
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-24 w-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
            <span className="text-5xl font-bold text-muted-foreground">404</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    ),
  },
])
