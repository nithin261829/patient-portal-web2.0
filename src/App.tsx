import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppConfig } from './hooks/useAppConfig'
import { useEffect, useState } from 'react'

function App() {
  const [error, setError] = useState<Error | null>(null)

  // Fetch app config on startup to get correct client_id and org_id
  useAppConfig()

  useEffect(() => {
    // Log that app is mounted
    console.log('[App] Mounted successfully')
  }, [])

  // Error boundary fallback
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  try {
    return <RouterProvider router={router} />
  } catch (err) {
    setError(err as Error)
    return null
  }
}

export default App
