'use client';

import { useEffect } from 'react';
import { isProductionSecurityEnabled, isDebugModeEnabled } from '../../configs/security.config';

export default function ProductionSecurity() {
  useEffect(() => {
    // Chỉ áp dụng khi production security được bật
    if (!isProductionSecurityEnabled()) {
      return;
    }

    // Chặn F12
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
      
      // Chặn Ctrl+Shift+C (inspect element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      
      // Chặn Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Chặn Ctrl+Shift+J (console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
    };

    // Chặn chuột phải
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Chặn devtools detection
    const detectDevTools = () => {
      const threshold = 160;
      
      // Method 1: Check window size
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; font-size: 18px; color: #333;">Developer tools are not allowed in production.</div>';
        return;
      }
      
      // Method 2: Check console timing
      const start = performance.now();
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; font-size: 18px; color: #333;">Developer tools are not allowed in production.</div>';
        return;
      }
    };

    // Chặn console methods
    const disableConsole = () => {
      const noop = () => {};
      const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
      
      methods.forEach(method => {
        console[method] = noop;
      });
    };

    // Chặn eval và Function constructor
    const disableEval = () => {
      window.eval = () => {
        throw new Error('eval is disabled in production');
      };
      
      window.Function = () => {
        throw new Error('Function constructor is disabled in production');
      };
    };

    // Áp dụng các biện pháp bảo mật
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    
    // Disable console và eval
    disableConsole();
    disableEval();
    
    // Chạy detection định kỳ
    const interval = setInterval(detectDevTools, 1000);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      clearInterval(interval);
    };
  }, []);

  // Không render gì khi production security được bật
  if (isProductionSecurityEnabled()) {
    return null;
  }

  // Chỉ hiển thị khi debug mode được bật
  if (!isDebugModeEnabled()) {
    return null;
  }

  // Hiển thị thông báo debug
  return (
    <div className="fixed bottom-4 left-24 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded z-50">
      <div className="text-sm">
        🔒 Production Security: <strong>DISABLED</strong> (Development Mode)
      </div>
    </div>
  );
} 