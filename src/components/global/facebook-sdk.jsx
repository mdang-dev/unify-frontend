'use client';

import { useEffect } from 'react';
import { facebookSDKConfig } from '../../configs/facebook.config';

export default function FacebookSDK() {
  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      // Check if SDK is already loaded
      if (window.FB) {
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      // Initialize Facebook SDK when loaded
      script.onload = () => {
        window.fbAsyncInit = function() {
          window.FB.init(facebookSDKConfig);
        };
      };

      // Add script to document
      document.head.appendChild(script);
    };

    // Load SDK when component mounts
    loadFacebookSDK();

    // Cleanup function
    return () => {
      // Remove script if component unmounts
      const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
