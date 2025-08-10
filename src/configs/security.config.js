// Security configuration for different environments
export const SECURITY_CONFIG = {
  development: {
    // Development environment - more permissive
    csp: {
      // Allow all HTTP(S) and WS(S) connections in development to avoid CSP blocks
      connectSrc: "'self' http: https: ws: wss:",
      mediaSrc: "'self' https://res.cloudinary.com data: blob:",
      imgSrc: "'self' https://res.cloudinary.com data: https: blob:",
      upgradeInsecureRequests: false,
      strictTransportSecurity: false
    },
    productionSecurity: {
      enabled: false, // Disable production security features in dev
      debugMode: true
    }
  },
  production: {
    // Production environment - strict security
    csp: {
      connectSrc: "'self' https://*.unify.qzz.io https://unify.qzz.io ws: wss: https:",
      mediaSrc: "'self' https://res.cloudinary.com data: blob:",
      imgSrc: "'self' https://res.cloudinary.com data: https: blob:",
      upgradeInsecureRequests: true,
      strictTransportSecurity: true
    },
    productionSecurity: {
      enabled: true, // Enable all production security features
      debugMode: false
    }
  }
};

// Get current environment config
export function getSecurityConfig() {
  const env = process.env.NODE_ENV || 'development';
  return SECURITY_CONFIG[env] || SECURITY_CONFIG.development;
}

// Helper function to check if production security is enabled
export function isProductionSecurityEnabled() {
  const config = getSecurityConfig();
  return config.productionSecurity.enabled;
}

// Helper function to check if debug mode is enabled
export function isDebugModeEnabled() {
  const config = getSecurityConfig();
  return config.productionSecurity.debugMode;
} 