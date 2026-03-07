import { useEffect, useState } from 'react';

interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
}

/**
 * SyncStatusIndicator shows the real-time status of data persistence.
 * Displays "Syncing..." when active, and a colored indicator for connection status.
 * - Green: Connected and synced
 * - Red: Offline or sync errors
 * - Pulsing: Currently syncing
 */
export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor sync state from SyncingBackend if available
  useEffect(() => {
    const checkSyncState = () => {
      // Access the engine from the window for sync state monitoring
      const engine = (globalThis as any).__PRESSURE_ENGINE__;
      if (!engine?.persistence) return;

      // Get the backend via the getter method
      const backend = engine.persistence.getBackend();
      if (!backend || !('isSyncing' in backend)) {
        return;
      }

      setStatus((prev) => ({
        ...prev,
        isSyncing: backend.isSyncing,
      }));
    };

    // Check sync state frequently
    const interval = setInterval(checkSyncState, 300);

    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (status.isSyncing) return 'Syncing...';
    return status.isOnline ? 'Online' : 'Offline';
  };
  const statusText = getStatusText();
  const statusColor = status.isOnline ? '#10b981' : '#ef4444';
  const isDotPulsing = status.isSyncing;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingRight: 8,
        fontSize: 11,
        fontWeight: 500,
        color: statusColor,
      }}
    >
      <span>{statusText}</span>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
          animation: isDotPulsing ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
