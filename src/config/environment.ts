// Environment configuration
// Matches patient-portal-web Angular environment files
// Supports: dev (.dev), demo (.xyz), prod (.app)

type EnvType = 'dev' | 'demo' | 'prod';

// Detect tenant from URL subdomain
function getTenantFromUrl(): string | null {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) {
    return null;
  }

  const subdomain = hostname.split('.')[0];

  if (subdomain && !['www', 'api', 'apis', 'dev', 'stage', 'staging'].includes(subdomain)) {
    return subdomain;
  }

  return null;
}

// Detect environment type from hostname
function getEnvTypeFromUrl(): EnvType {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'dev';
  }
  if (hostname.includes('.tensorlinks.dev') || hostname.includes('dev-')) {
    return 'dev';
  }
  if (hostname.includes('.tensorlinks.xyz')) {
    return 'demo';
  }
  if (hostname.includes('.tensorlinks.app')) {
    return 'prod';
  }

  return 'dev';
}

// Environment-specific configurations (matching Angular environment files)
const envConfigs = {
  dev: {
    production: false,
    debug: false,
    useRecaptcha: true,
    showThemeSwitcher: true,
    clientId: 'brightsmiledental',
    orgId: 'tlnk-def-1f3ce',
    confUrl: 'http://localhost:4300',
    apiKey: 'AIzaSyAtBxir34odZFDYlGve33oDRz367zupPTM',
    apiUrl: 'http://localhost:4300',
    tenantId: 'brightsmiledental',
    googleMapsApiKey: 'AIzaSyCvG_AiJgRBkzNS1dP7WGq5500BFZi9m8M',
    firebase: {
      apiKey: 'AIzaSyDRNb3ei0euI5uHVKA2wU1cum96Ytytwd8',
      authDomain: 'project-001-dev.firebaseapp.com',
      projectId: 'project-001-dev',
      storageBucket: 'project-001-dev.firebasestorage.app',
      messagingSenderId: '1011039981452',
      appId: '1:1011039981452:web:b7d9828b34d9d77c2c90a9',
      measurementId: 'G-CXNQZZXSDT',
    },
    recaptcha: {
      siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    },
  },
  demo: {
    production: true,
    debug: false,
    useRecaptcha: true,
    showThemeSwitcher: true,
    clientId: '',
    orgId: '',
    confUrl: 'https://tl-infra.apis.tensorlinks.xyz',
    apiKey: 'AIzaSyDp2hdGdFPQmUXJC1eXSaVEul3cw8murl4',
    apiUrl: 'https://apis.tensorlinks.xyz/patient-portal',
    tenantId: 'brightsmiledental',
    googleMapsApiKey: 'AIzaSyCvG_AiJgRBkzNS1dP7WGq5500BFZi9m8M',
    firebase: {
      apiKey: 'AIzaSyDp2hdGdFPQmUXJC1eXSaVEul3cw8murl4',
      authDomain: 'project-001-demo-463023.firebaseapp.com',
      projectId: 'project-001-demo-463023',
      storageBucket: 'project-001-demo-463023.firebasestorage.app',
      messagingSenderId: '240758130642',
      appId: '1:240758130642:web:4e4a378c46df0b74e2aa0b',
    },
    recaptcha: {
      siteKey: '6Ldb7NgrAAAAAAm6BGdzvuSsLrteLgp4WPZqIfYA',
    },
  },
  prod: {
    production: true,
    debug: false,
    useRecaptcha: true,
    showThemeSwitcher: false,
    clientId: '',
    orgId: '',
    confUrl: 'https://tl-infra.apis.tensorlinks.app',
    apiKey: 'AIzaSyD3nrcCfNW2Z7h_e6jELv-L8N4ji0hRIow',
    apiUrl: 'https://apis.tensorlinks.app/patient-portal',
    tenantId: 'todaysdentalalexandria',
    googleMapsApiKey: 'AIzaSyCvG_AiJgRBkzNS1dP7WGq5500BFZi9m8M',
    firebase: {
      apiKey: 'AIzaSyD3nrcCfNW2Z7h_e6jELv-L8N4ji0hRIow',
      authDomain: 'project-001-283520.firebaseapp.com',
      projectId: 'project-001-283520',
      storageBucket: 'project-001-283520.appspot.com',
      messagingSenderId: '974816792856',
      appId: '1:974816792856:web:ecce2223b57ad7c8990e6d',
      measurementId: 'G-8CFFSHZ8S8',
    },
    recaptcha: {
      siteKey: '6LdQTAkqAAAAAMaSLIYOIX9q4qHkPPN6CqoeJ2hM',
    },
  },
} as const;

const envType = getEnvTypeFromUrl();
const currentEnv = envConfigs[envType];

// Detect tenant from URL, env var, or use environment default
const detectedTenant = getTenantFromUrl();
const tenantId = import.meta.env.VITE_TENANT_ID || detectedTenant || currentEnv.tenantId;

// Allow .env overrides for dev flexibility
export const environment = {
  ...currentEnv,
  envType,
  tenantId,
  clientId: tenantId,
  orgId: import.meta.env.VITE_ORG_ID || currentEnv.orgId,
  apiUrl: import.meta.env.VITE_API_URL || currentEnv.apiUrl,
  confUrl: import.meta.env.VITE_CONF_URL || currentEnv.confUrl,
  apiKey: import.meta.env.VITE_API_KEY || currentEnv.apiKey,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || currentEnv.googleMapsApiKey,
  release: {
    version: '2.0.0',
    date: '2025-01-09',
    notes: 'React rewrite',
  },
};

// Log environment on load
console.log(`[Environment] ${envType} | Tenant: ${tenantId} | API: ${environment.apiUrl}`);

// Helper to get tenant-aware URLs
export const getTenantUrl = (baseUrl: string, orgTenantId?: string): string => {
  if (orgTenantId) {
    return baseUrl.replace('https://', `https://${orgTenantId}.`);
  }
  return baseUrl;
};
