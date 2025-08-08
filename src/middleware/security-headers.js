import { getSecurityConfig } from '../configs/security.config';

export function addSecurityHeaders(headers) {
  const config = getSecurityConfig();
  
  // Chặn XSS attacks
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Chặn clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Chặn MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Strict transport security (theo config)
  if (config.csp.strictTransportSecurity) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy (theo config)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${config.csp.imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${config.csp.connectSrc}`,
    `media-src ${config.csp.mediaSrc}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  
  // Thêm upgrade-insecure-requests nếu được bật
  if (config.csp.upgradeInsecureRequests) {
    cspDirectives.push("upgrade-insecure-requests");
  }
  
  headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '));
  
  return headers;
} 