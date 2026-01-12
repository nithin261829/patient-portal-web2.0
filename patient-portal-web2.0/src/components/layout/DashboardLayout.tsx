import { Outlet, Navigate } from 'react-router-dom'
import { Header } from './Header'
import { useAuthStore } from '@/stores/auth-store'
import { Toaster } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const isMobile = useIsMobile()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className={cn(
        "flex-1 container px-4",
        isMobile ? "py-4 pb-20" : "py-6" // Add bottom padding on mobile for bottom nav
      )}>
        <Outlet />
      </main>
      <Toaster
        position={isMobile ? "top-center" : "top-right"}
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          className: isMobile ? 'text-sm' : '',
        }}
      />
    </div>
  )
}
