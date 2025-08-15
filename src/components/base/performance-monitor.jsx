'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    memory: 0,
    cpu: 0,
    fps: 0,
    connections: 0
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const memoryInfoRef = useRef(null);

  // ✅ OPTIMIZED: Use useCallback to prevent unnecessary re-renders
  const updateMetrics = useCallback(() => {
    try {
      // Memory usage
      if ('memory' in performance) {
        memoryInfoRef.current = performance.memory;
        const memoryUsage = Math.round(memoryInfoRef.current.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memory: memoryUsage }));
      }

      // FPS calculation
      const currentTime = performance.now();
      frameCountRef.current++;
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        setMetrics(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      // WebSocket connections (estimated)
      const wsConnections = document.querySelectorAll('script[src*="ws"]').length;
      setMetrics(prev => ({ ...prev, connections: wsConnections }));
    } catch (error) {
      console.warn('Performance monitoring error:', error);
    }
  }, []);

  // ✅ OPTIMIZED: Start monitoring with cleanup
  useEffect(() => {
    if (isVisible) {
      // ✅ OPTIMIZED: Reduced interval from 5000ms to 10000ms to save resources
      intervalRef.current = setInterval(updateMetrics, 10000);
      
      // Initial update
      updateMetrics();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, updateMetrics]);

  // ✅ OPTIMIZED: Toggle visibility with cleanup
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // ✅ OPTIMIZED: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg z-50"
        title="Show Performance Monitor"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 min-w-[200px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button
          onClick={toggleVisibility}
          className="text-gray-400 hover:text-white text-lg"
          title="Hide Performance Monitor"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={metrics.memory > 100 ? 'text-red-400' : 'text-green-400'}>
            {metrics.memory} MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Connections:</span>
          <span className={metrics.connections > 10 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.connections}
          </span>
        </div>
        
        {memoryInfoRef.current && (
          <>
            <div className="flex justify-between">
              <span>Heap Limit:</span>
              <span>{Math.round(memoryInfoRef.current.jsHeapSizeLimit / 1024 / 1024)} MB</span>
            </div>
            
            <div className="flex justify-between">
              <span>Heap Used:</span>
              <span>{Math.round(memoryInfoRef.current.usedJSHeapSize / 1024 / 1024)} MB</span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <button
          onClick={() => {
            if ('memory' in performance) {
              performance.memory && console.log('Memory Info:', performance.memory);
            }
            console.log('Performance Timeline:', performance.getEntriesByType('measure'));
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
}; 