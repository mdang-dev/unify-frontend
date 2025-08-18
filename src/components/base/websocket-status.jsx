'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/use-websocket';

export const WebSocketStatus = ({ userId }) => {
  const { connected, error, poolSize } = useWebSocket(userId);
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!connected) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/ws/health');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (err) {
        console.warn('Failed to fetch WebSocket metrics:', err);
      }
    };

    // Fetch metrics every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);
    fetchMetrics(); // Initial fetch

    return () => clearInterval(interval);
  }, [connected]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Show WebSocket Status"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          WebSocket Status
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
        )}
      </div>

      {/* Connection Pool */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Connection Pool
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Active Connections: {poolSize || 0}
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Performance Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                metrics.status === 'HEALTHY' ? 'bg-green-100 text-green-800' :
                metrics.status === 'HIGH_LOAD' ? 'bg-yellow-100 text-yellow-800' :
                metrics.status === 'HIGH_LATENCY' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {metrics.status}
              </span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Active:</span>
              <span className="ml-2 font-medium">{metrics.activeConnections}</span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Avg Latency:</span>
              <span className="ml-2 font-medium">{metrics.avgLatency}ms</span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Max Latency:</span>
              <span className="ml-2 font-medium">{metrics.maxLatency}ms</span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Messages Sent:</span>
              <span className="ml-2 font-medium">{metrics.totalMessagesSent}</span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400">Messages Received:</span>
              <span className="ml-2 font-medium">{metrics.totalMessagesReceived}</span>
            </div>
          </div>

          {/* Error Metrics */}
          {(metrics.connectionErrors > 0 || metrics.authenticationFailures > 0) && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <h5 className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                Error Metrics
              </h5>
              <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {metrics.connectionErrors > 0 && (
                  <div>Connection Errors: {metrics.connectionErrors}</div>
                )}
                {metrics.authenticationFailures > 0 && (
                  <div>Auth Failures: {metrics.authenticationFailures}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {metrics && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
