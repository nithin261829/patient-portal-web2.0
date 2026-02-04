import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2, FileImage, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DocumentField {
  label: string
  type: 'image' | 'document'
  name: string
  required?: boolean
  helpText?: string
}

interface DocumentUploadProps {
  metadata: {
    title: string
    description?: string
  }
  fields: DocumentField[]
  onUploadComplete?: (result: { success: boolean; count: number }) => void
  clientId: string
  patientId: string
}

interface FileWithMeta {
  file: File
  fieldName: string
  docCategory: number
  description: string
  preview?: string
  status: 'pending' | 'processing' | 'uploaded' | 'failed'
}

const MAX_FILE_SIZE_MB = 10
const MAX_DIMENSION = 800
const COMPRESSION_QUALITY = 0.9

export function DocumentUpload({
  metadata,
  fields,
  onUploadComplete,
  clientId,
  patientId,
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithMeta[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const getDocCategory = (fieldName: string): number => {
    if (fieldName.includes('driversLicense')) return 1
    if (fieldName.includes('insuranceCard')) return 2
    return 0
  }

  const getDescription = (fieldName: string): string => {
    const descriptions: { [key: string]: string } = {
      driversLicenseFront: "Driver's License Front",
      driversLicenseBack: "Driver's License Back",
      insuranceCardFront: 'Insurance Card Front',
      insuranceCardBack: 'Insurance Card Back',
    }
    return descriptions[fieldName] || fieldName
  }

  const isValidFileType = (fileType: string, fieldType: string): boolean => {
    if (fieldType === 'image') {
      return ['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)
    }
    if (fieldType === 'document') {
      return fileType === 'application/pdf'
    }
    return false
  }

  const resizeAndCompressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const img = new Image()

      reader.onload = (e) => {
        img.src = e.target?.result as string

        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          let { width, height } = img

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = (height * MAX_DIMENSION) / width
              width = MAX_DIMENSION
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = (width * MAX_DIMENSION) / height
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Compression failed'))
              }
            },
            'image/jpeg',
            COMPRESSION_QUALITY
          )
        }

        img.onerror = () => reject(new Error('Error loading image'))
      }

      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, field: DocumentField) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    // Validate file type
    if (!isValidFileType(file.type, field.type)) {
      const acceptedTypes = field.type === 'image' ? 'JPEG, JPG, PNG' : 'PDF'
      toast.error(`Please select a valid ${acceptedTypes} file`)
      return
    }

    try {
      // Create preview and process file
      let processedFile = file
      let preview: string | undefined

      if (field.type === 'image') {
        // Update status to processing
        const processingFile: FileWithMeta = {
          file,
          fieldName: field.name,
          docCategory: getDocCategory(field.name),
          description: getDescription(field.name),
          status: 'processing',
        }
        setSelectedFiles((prev) => [...prev.filter((f) => f.fieldName !== field.name), processingFile])

        // Compress image
        processedFile = await resizeAndCompressImage(file)

        // Create preview
        preview = URL.createObjectURL(processedFile)
      }

      const fileWithMeta: FileWithMeta = {
        file: processedFile,
        fieldName: field.name,
        docCategory: getDocCategory(field.name),
        description: getDescription(field.name),
        preview,
        status: 'pending',
      }

      setSelectedFiles((prev) => [...prev.filter((f) => f.fieldName !== field.name), fileWithMeta])
      toast.success(`${field.label} selected`)
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Error processing file. Please try again.')
    }
  }

  const removeFile = (fieldName: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.fieldName === fieldName)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.fieldName !== fieldName)
    })
    if (fileInputRefs.current[fieldName]) {
      fileInputRefs.current[fieldName]!.value = ''
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()

      selectedFiles.forEach((fileObj) => {
        formData.append('documents', fileObj.file, fileObj.file.name)
        formData.append('DocCategory', fileObj.docCategory.toString())
        formData.append('Description', fileObj.description)
        formData.append('DateCreated', new Date().toISOString())
      })

      // Import dynamically to avoid circular dependencies
      const { apiService } = await import('@/services/api')

      await apiService.documents.upload(clientId, patientId, formData)

      // Update all files to uploaded status
      setSelectedFiles((prev) => prev.map((f) => ({ ...f, status: 'uploaded' as const })))

      toast.success(`${selectedFiles.length} document(s) uploaded successfully!`)
      onUploadComplete?.({ success: true, count: selectedFiles.length })

      // Clear form after short delay
      setTimeout(() => {
        selectedFiles.forEach((f) => {
          if (f.preview) URL.revokeObjectURL(f.preview)
        })
        setSelectedFiles([])
        Object.values(fileInputRefs.current).forEach((ref) => {
          if (ref) ref.value = ''
        })
      }, 2000)
    } catch (error: any) {
      console.error('Error uploading documents:', error)
      setSelectedFiles((prev) => prev.map((f) => ({ ...f, status: 'failed' as const })))
      toast.error(error.response?.data?.detail || 'Failed to upload documents')
      onUploadComplete?.({ success: false, count: 0 })
    } finally {
      setIsUploading(false)
    }
  }

  const getAcceptedTypes = (fieldType: string) => {
    return fieldType === 'image' ? 'image/jpeg,image/jpg,image/png' : 'application/pdf'
  }

  const getFileStatus = (fieldName: string) => {
    return selectedFiles.find((f) => f.fieldName === fieldName)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{metadata.title}</CardTitle>
        {metadata.description && <CardDescription>{metadata.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field) => {
          const fileStatus = getFileStatus(field.name)
          const Icon = field.type === 'image' ? FileImage : FileText

          return (
            <div key={field.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                {fileStatus && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(field.name)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}

              {!fileStatus ? (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    'hover:border-primary hover:bg-muted/50'
                  )}
                  onClick={() => fileInputRefs.current[field.name]?.click()}
                >
                  <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    {field.type === 'image' ? 'JPEG, JPG, PNG' : 'PDF'} (max {MAX_FILE_SIZE_MB}MB)
                  </p>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[field.name] = el
                    }}
                    id={field.name}
                    type="file"
                    accept={getAcceptedTypes(field.type)}
                    onChange={(e) => handleFileSelect(e, field)}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-3">
                  {fileStatus.preview && (
                    <img
                      src={fileStatus.preview}
                      alt={field.label}
                      className="w-full h-48 object-contain rounded bg-muted"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{fileStatus.file.name}</span>
                    </div>
                    {fileStatus.status === 'processing' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {fileStatus.status === 'uploaded' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {fileStatus.status === 'failed' && <X className="h-4 w-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(fileStatus.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0} className="w-full">
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
