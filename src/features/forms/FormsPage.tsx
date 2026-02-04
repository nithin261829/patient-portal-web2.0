import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  CheckCircle2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import { FormCard, type FormData } from '@/components/forms/FormCard'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

type FilterTab = 'pending' | 'completed' | 'all'

export function FormsPage() {
  const navigate = useNavigate()
  const { patient, clientId } = useAuthStore()
  const isMobile = useIsMobile()

  const [forms, setForms] = useState<FormData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [clientId, patient?.patientId])

  const fetchForms = async () => {
    if (!clientId || !patient?.patientId) return

    setIsLoading(true)
    try {
      const response = await apiService.forms.getAllForms(clientId, patient.patientId)
      const transformedForms: FormData[] = (response.data || []).map((form: any) => ({
        id: form.formId || form.id,
        title: form.formName || form.title,
        description: form.description,
        category: form.category,
        status: form.status?.toLowerCase() || 'pending',
        dueDate: form.dueDate,
        submittedDate: form.submittedDate || form.completedDate,
        completedSections: form.completedSections,
        totalSections: form.totalSections,
        estimatedTime: form.estimatedTime || 10,
        isRequired: form.isRequired,
        assignedBy: form.assignedBy || form.providerName,
        appointmentId: form.appointmentId
      }))
      setForms(transformedForms)
    } catch (error) {
      console.error('Error fetching forms:', error)
      toast.error('Failed to load forms')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter forms
  const filteredForms = forms
    .filter((form) => {
      if (filterTab === 'pending') {
        return form.status === 'pending' || form.status === 'in_progress'
      }
      if (filterTab === 'completed') {
        return form.status === 'completed' || form.status === 'submitted'
      }
      return true
    })
    .filter((form) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        form.title.toLowerCase().includes(query) ||
        form.description?.toLowerCase().includes(query) ||
        form.category?.toLowerCase().includes(query)
      )
    })

  // Stats
  const pendingCount = forms.filter((f) => f.status === 'pending' || f.status === 'in_progress').length

  // Handlers
  const handleStart = (formId: string | number) => {
    navigate(`/dashboard/forms/${formId}`)
  }

  const handleContinue = (formId: string | number) => {
    navigate(`/dashboard/forms/${formId}`)
  }

  const handleView = (formId: string | number) => {
    navigate(`/dashboard/forms/${formId}/view`)
  }

  return (
    <div className={cn("space-y-4", !isMobile && "space-y-6")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            Forms
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground text-sm mt-1">
              Complete required documents
            </p>
          )}
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Mobile Search */}
      {isMobile && showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as FilterTab)}
        >
          <TabsList className={cn(isMobile && "grid grid-cols-3")}>
            <TabsTrigger value="pending" className={cn(isMobile && "text-xs")}>
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className={cn(isMobile && "text-xs")}>Done</TabsTrigger>
            <TabsTrigger value="all" className={cn(isMobile && "text-xs")}>All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Desktop Search */}
        {!isMobile && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <Card>
          <CardContent className={cn("text-center", isMobile ? "py-10" : "py-16")}>
            {filterTab === 'pending' ? (
              <>
                <CheckCircle2 className={cn(
                  "mx-auto text-success mb-3",
                  isMobile ? "h-10 w-10" : "h-12 w-12"
                )} />
                <h3 className={cn(
                  "font-medium text-foreground mb-1",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  All caught up!
                </h3>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile && "text-sm"
                )}>
                  No pending forms
                </p>
              </>
            ) : (
              <>
                <FileText className={cn(
                  "mx-auto text-muted-foreground mb-3",
                  isMobile ? "h-10 w-10" : "h-12 w-12"
                )} />
                <h3 className={cn(
                  "font-medium text-foreground mb-1",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  No forms found
                </h3>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile && "text-sm"
                )}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No forms available'}
                </p>
                {searchQuery && (
                  <Button variant="outline" className="mt-4" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "space-y-3",
          !isMobile && "grid grid-cols-2 gap-4 space-y-0"
        )}>
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              variant={isMobile ? "compact" : "default"}
              onStart={handleStart}
              onContinue={handleContinue}
              onView={handleView}
            />
          ))}
        </div>
      )}
    </div>
  )
}
