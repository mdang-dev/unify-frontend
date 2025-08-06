'use client';

import { useEffect, useState, useCallback } from 'react';

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    memory: null,
    fps: 0,
    loadTime: 0,
    renderTime: 0,
  });

  const updateMetrics = useCallback(() => {
    // Memory usage
    if ('memory' in performance) {
      setMetrics(prev => ({
        ...prev,
        memory: {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        }
      }));
    }

    // FPS calculation
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: frameCount
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, []);

  useEffect(() => {
    // Page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    setMetrics(prev => ({
      ...prev,
      loadTime: Math.round(loadTime)
    }));

    // Start monitoring
    updateMetrics();
    
    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>FPS: {metrics.fps}</div>
      {metrics.memory && (
        <div>Memory: {metrics.memory.used}MB / {metrics.memory.total}MB</div>
      )}
      <div>Load Time: {metrics.loadTime}ms</div>
    </div>
  );
}; 