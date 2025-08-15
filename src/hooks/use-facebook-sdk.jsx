'use client';

import { useState, useEffect } from 'react';

export const useFacebookSDK = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFacebookSDK = () => {
      if (typeof window !== 'undefined' && window.FB) {
        setIsReady(true);
        setIsLoading(false);
      } else {
        // Check again after a short delay
        setTimeout(checkFacebookSDK, 100);
      }
    };

    checkFacebookSDK();
  }, []);

  const shareToFacebook = (url, quote = '') => {
    if (!isReady) {
      console.warn('Facebook SDK not ready');
      return Promise.reject(new Error('Facebook SDK not ready'));
    }

    return new Promise((resolve, reject) => {
      window.FB.ui({
        method: 'share',
        href: url,
        quote: quote,
      }, (response) => {
        if (response && !response.error_message) {
          resolve(response);
        } else {
          reject(new Error(response?.error_message || 'Failed to share'));
        }
      });
    });
  };

  const shareToMessenger = (url) => {
    if (!isReady) {
      console.warn('Facebook SDK not ready');
      return Promise.reject(new Error('Facebook SDK not ready'));
    }

    return new Promise((resolve, reject) => {
      window.FB.ui({
        method: 'send',
        link: url,
        app_id: '737901299112236',
        redirect_uri: window.location.origin,
      }, (response) => {
        // Handle different response scenarios
        if (response === null) {
          // User cancelled the dialog
          reject(new Error('User cancelled sharing'));
        } else if (response && response.error_message) {
          // Facebook returned an error
          reject(new Error(response.error_message));
        } else if (response && response.error_code) {
          // Facebook returned an error code
          reject(new Error(`Facebook error ${response.error_code}: ${response.error_message || 'Unknown error'}`));
        } else {
          // Success
          resolve(response);
        }
      });
    });
  };

  return {
    isReady,
    isLoading,
    shareToFacebook,
    shareToMessenger,
  };
};
