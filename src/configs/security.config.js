// Security configuration for different environments
export const SECURITY_CONFIG = {
  development: {
    // Development environment - more permissive
    csp: {
      connectSrc: "'self' http://localhost:8080 https://localhost:8080 ws: wss: http://localhost:3000",
      mediaSrc: "'self' https://res.cloudinary.com data: blob:",
      imgSrc: "'self' https://res.cloudinary.com data: https:",
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
      connectSrc: "'self' https://your-production-domain.com ws: wss:",
      mediaSrc: "'self' https://res.cloudinary.com data: blob:",
      imgSrc: "'self' https://res.cloudinary.com data: https:",
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