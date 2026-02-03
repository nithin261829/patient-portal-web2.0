import { MapPin, Phone, Mail, Globe, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

export function ClinicInfo() {
  const clinic = useAuthStore((state) => state.clinic)

  if (!clinic) {
    return null
  }

  const handleAddressClick = () => {
    if (clinic.maps_url) {
      window.open(clinic.maps_url, '_blank')
    } else if (clinic.address) {
      // Fallback to Google Maps search
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`,
        '_blank'
      )
    }
  }

  const handlePhoneClick = () => {
    if (clinic.phoneNumber) {
      window.location.href = `tel:${clinic.phoneNumber}`
    }
  }

  const handleEmailClick = () => {
    if (clinic.email) {
      window.location.href = `mailto:${clinic.email}`
    }
  }

  const handleWebsiteClick = () => {
    if (clinic.clinic_website_url) {
      window.open(clinic.clinic_website_url, '_blank')
    }
  }

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/default-clinic-logo.svg'
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* Clinic Logo and Name */}
        <div className="flex flex-col items-center mb-6">
          {clinic.logo_url && (
            <img
              src={clinic.logo_url}
              alt={`${clinic.displayName} logo`}
              onError={handleLogoError}
              className="h-20 w-auto mb-4 object-contain"
            />
          )}
          <h2 className="text-2xl font-bold text-center">{clinic.displayName}</h2>
          {clinic.location && (
            <p className="text-sm text-muted-foreground mt-1">{clinic.location}</p>
          )}
        </div>

        {/* Clinic Details */}
        <div className="space-y-3">
          {/* Address */}
          {clinic.address && (
            <div
              onClick={handleAddressClick}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">Address</div>
                <div className="text-sm flex items-center gap-1">
                  {clinic.address}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Phone */}
          {clinic.phoneNumber && (
            <div
              onClick={handlePhoneClick}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">Phone</div>
                <div className="text-sm">{clinic.phoneNumber}</div>
              </div>
            </div>
          )}

          {/* Email */}
          {clinic.email && (
            <div
              onClick={handleEmailClick}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-sm truncate">{clinic.email}</div>
              </div>
            </div>
          )}

          {/* Website */}
          {clinic.clinic_website_url && (
            <div
              onClick={handleWebsiteClick}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">Website</div>
                <div className="text-sm flex items-center gap-1">
                  Visit our website
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
