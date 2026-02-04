import { useEffect, useState } from 'react'
import {
  FileText,
  FileImage,
  Download,
  Eye,
  Search,
  File,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth-store'
import { apiService } from '@/services/api'

interface Document {
  documentId: string
  fileName: string
  description?: string
  category?: string
  documentType?: string
  uploadDate: string
  fileSize?: number
  mimeType?: string
  isImage?: boolean
  isPdf?: boolean
  downloadUrl?: string
}

export function DocumentsPage() {
  const navigate = useNavigate()
  const { clientId, patient } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'clinical' | 'forms'>('clinical')

  useEffect(() => {
    fetchDocuments()
  }, [clientId, patient])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchQuery, activeTab])

  const fetchDocuments = async () => {
    const patientId =
      (patient as any)?.patientId ||
      (patient as any)?.patient_id ||
      (patient as any)?.id

    if (!clientId || !patientId) {
      console.warn('[DocumentsPage] Missing clientId or patientId')
      return
    }

    setIsLoading(true)
    try {
      const response = await apiService.documents.getAll(clientId, patientId)
      const docs = response.data?.documents || []

      // Sort by upload date, newest first
      docs.sort((a: Document, b: Document) => {
        const dateA = new Date(a.uploadDate || 0).getTime()
        const dateB = new Date(b.uploadDate || 0).getTime()
        return dateB - dateA
      })

      setDocuments(docs)
    } catch (error: any) {
      console.error('[DocumentsPage] Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    // Filter by tab (clinical vs forms)
    if (activeTab === 'forms') {
      filtered = filtered.filter(
        (doc) =>
          doc.category?.toLowerCase().includes('form') ||
          doc.documentType?.toLowerCase().includes('form')
      )
    } else {
      filtered = filtered.filter(
        (doc) =>
          !doc.category?.toLowerCase().includes('form') &&
          !doc.documentType?.toLowerCase().includes('form')
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.fileName?.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.category?.toLowerCase().includes(query)
      )
    }

    setFilteredDocuments(filtered)
  }

  const getDocumentIcon = (doc: Document) => {
    if (doc.isImage || doc.mimeType?.startsWith('image/')) {
      return FileImage
    }
    if (doc.isPdf || doc.mimeType === 'application/pdf') {
      return FileText
    }
    if (
      doc.mimeType?.includes('word') ||
      doc.mimeType?.includes('document')
    ) {
      return FileText
    }
    if (
      doc.mimeType?.includes('excel') ||
      doc.mimeType?.includes('spreadsheet')
    ) {
      return FileSpreadsheet
    }
    return File
  }

  const handleDownload = async (doc: Document) => {
    const patientId =
      (patient as any)?.patientId ||
      (patient as any)?.patient_id ||
      (patient as any)?.id

    if (!clientId || !patientId) return

    try {
      const response = await apiService.documents.download(
        clientId,
        patientId,
        doc.documentId
      )

      // Create download link
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.fileName || `document_${doc.documentId}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Document downloaded')
    } catch (error) {
      console.error('[DocumentsPage] Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const handleView = (doc: Document) => {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank')
    } else {
      handleDownload(doc)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">View and manage your medical documents</p>
        </div>
        <Button onClick={() => navigate('/dashboard/profile/manage')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="clinical">Clinical Documents</TabsTrigger>
          <TabsTrigger value="forms">Completed Forms</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading documents...</p>
              </CardContent>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium text-foreground mb-1">No documents found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Your documents will appear here once uploaded'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {filteredDocuments.length} {filteredDocuments.length === 1 ? 'Document' : 'Documents'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {filteredDocuments.map((doc) => {
                    const Icon = getDocumentIcon(doc)
                    return (
                      <div
                        key={doc.documentId}
                        className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{doc.fileName}</p>
                            {doc.category && (
                              <Badge variant="outline" className="text-xs">
                                {doc.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>
                              {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                            </span>
                            {doc.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">{doc.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.downloadUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
