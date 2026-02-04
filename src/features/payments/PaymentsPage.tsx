import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Search,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PaymentCard, type PaymentData } from '@/components/payments/PaymentCard'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

type FilterTab = 'outstanding' | 'paid' | 'all'

export function PaymentsPage() {
  const navigate = useNavigate()
  const { patient, clientId } = useAuthStore()
  const isMobile = useIsMobile()

  const [payments, setPayments] = useState<PaymentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>('outstanding')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [clientId, patient?.patientId])

  const fetchPayments = async () => {
    if (!clientId || !patient?.patientId) return

    setIsLoading(true)
    try {
      const response = await apiService.patient.getPayments(clientId, patient.patientId)
      const transformedPayments: PaymentData[] = (response.data || []).map((payment: any) => ({
        id: payment.paymentId || payment.id,
        amount: payment.amount || payment.totalAmount,
        description: payment.description || payment.serviceName || 'Dental Service',
        status: payment.status?.toLowerCase() || 'pending',
        dueDate: payment.dueDate,
        paidDate: payment.paidDate || payment.paymentDate,
        invoiceNumber: payment.invoiceNumber,
        paymentMethod: payment.paymentMethod,
        appointmentDate: payment.appointmentDate || payment.serviceDate,
        providerName: payment.providerName,
        category: payment.category
      }))
      setPayments(transformedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter
  const filteredPayments = payments
    .filter((payment) => {
      if (filterTab === 'outstanding') return payment.status === 'pending' || payment.status === 'overdue'
      if (filterTab === 'paid') return payment.status === 'paid'
      return true
    })
    .filter((payment) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        payment.description.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query)
      )
    })

  // Stats
  const outstandingBalance = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0)

  const outstandingCount = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  // Handlers
  const handlePay = (paymentId: string | number) => {
    const payment = payments.find((p) => p.id === paymentId)
    if (payment) {
      setSelectedPayment(payment)
      setPaymentDialogOpen(true)
    }
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Payment successful!')
      setPaymentDialogOpen(false)
      setSelectedPayment(null)
      setPayments((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id
            ? { ...p, status: 'paid' as const, paidDate: new Date().toISOString() }
            : p
        )
      )
    } catch (error) {
      toast.error('Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewDetails = (paymentId: string | number) => {
    navigate(`/dashboard/payments/${paymentId}`)
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
            Payments
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground text-sm mt-1">
              Manage billing & payments
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

      {/* Outstanding Balance Card */}
      {outstandingBalance > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className={cn("flex items-center gap-3", isMobile ? "p-3" : "p-4")}>
            <div className={cn(
              "rounded-full bg-warning/20 flex items-center justify-center shrink-0",
              isMobile ? "h-10 w-10" : "h-12 w-12"
            )}>
              <Wallet className={cn("text-warning", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium text-foreground", isMobile && "text-sm")}>
                {formatCurrency(outstandingBalance)} due
              </p>
              <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
                {outstandingCount} outstanding payment{outstandingCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              size={isMobile ? "sm" : "default"}
              onClick={() => {
                const first = payments.find((p) => p.status === 'pending' || p.status === 'overdue')
                if (first) handlePay(first.id)
              }}
            >
              Pay Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mobile Search */}
      {isMobile && showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
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
        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
          <TabsList className={cn(isMobile && "grid grid-cols-3")}>
            <TabsTrigger value="outstanding" className={cn(isMobile && "text-xs")}>
              Due
              {outstandingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {outstandingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid" className={cn(isMobile && "text-xs")}>Paid</TabsTrigger>
            <TabsTrigger value="all" className={cn(isMobile && "text-xs")}>All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Desktop Search */}
        {!isMobile && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
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
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className={cn("text-center", isMobile ? "py-10" : "py-16")}>
            <CheckCircle2 className={cn(
              "mx-auto text-success mb-3",
              isMobile ? "h-10 w-10" : "h-12 w-12"
            )} />
            <h3 className={cn(
              "font-medium text-foreground mb-1",
              isMobile ? "text-base" : "text-lg"
            )}>
              {filterTab === 'outstanding' ? 'All caught up!' : 'No payments'}
            </h3>
            <p className={cn("text-muted-foreground", isMobile && "text-sm")}>
              {filterTab === 'outstanding'
                ? 'No outstanding payments'
                : searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No payment history'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              variant="compact"
              onPay={handlePay}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className={cn(isMobile && "w-[calc(100%-2rem)] rounded-xl")}>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Review payment details</DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="py-3 space-y-3">
              <div className={cn("rounded-lg bg-muted/50 p-3 space-y-2", !isMobile && "p-4")}>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Description</span>
                  <span className="font-medium text-sm text-right">{selectedPayment.description}</span>
                </div>
                {selectedPayment.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Invoice</span>
                    <span className="font-medium text-sm">#{selectedPayment.invoiceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </div>
              </div>

              <div className={cn("rounded-lg border p-3", !isMobile && "p-4")}>
                <p className="text-muted-foreground text-xs mb-2">Payment Method</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Visa •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Default</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className={cn(isMobile && "flex-col gap-2")}>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isProcessing}
              className={cn(isMobile && "w-full")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              loading={isProcessing}
              className={cn(isMobile && "w-full")}
            >
              {isProcessing ? 'Processing...' : `Pay ${selectedPayment ? formatCurrency(selectedPayment.amount) : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
