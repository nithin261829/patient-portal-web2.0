// Hook to fetch and initialize app configuration
import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { environment } from '@/config/environment';

export function useAppConfig() {
  const { tenantId, updateClientConfig } = useAuthStore();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(
          `${environment.confUrl}/app_config/${tenantId}`,
          {
            headers: {
              'x-api-key': environment.apiKey,
            },
          }
        );

        if (response.data) {
          // Update auth store with correct client_id and org_id from config
          updateClientConfig({
            client_id: response.data.client_id,
            org_id: response.data.org_id,
          });

          // Store clinic details
          const { setClinic } = useAuthStore.getState();
          setClinic({
            id: response.data.id,
            client_id: response.data.client_id,
            displayName: response.data.displayName,
            name: response.data.name,
            logo_url: response.data.logo_url,
            phoneNumber: response.data.phoneNumber,
            address: response.data.address,
            email: response.data.email,
            clinic_website_url: response.data.clinic_website_url,
            location: response.data.location,
            timezone: response.data.timezone,
            maps_url: response.data.maps_url,
            business_type: response.data.business_type,
          });

          console.log('[Config] Loaded:', {
            client_id: response.data.client_id,
            org_id: response.data.org_id,
            tenantId: response.data.tenantId,
            clinic: response.data.displayName,
          });
        }
      } catch (error) {
        console.error('[Config] Failed to load app config:', error);
      }
    };

    // Fetch config on mount
    if (tenantId) {
      fetchConfig();
    }
  }, [tenantId, updateClientConfig]);
}
