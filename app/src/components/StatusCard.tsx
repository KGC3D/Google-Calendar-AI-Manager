'use client';

import { useEffect, useState } from 'react';
import type { ConnectionStatus } from '@/lib/types';

export default function StatusCard() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/connection')
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false, lastChecked: new Date().toISOString() }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Connection Status
      </h2>
      {loading ? (
        <p className="text-sm text-gray-400">Checking...</p>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status?.connected ? 'bg-green-500' : 'bg-red-400'
            }`}
          />
          <span className="text-sm font-medium text-gray-800">
            {status?.connected ? 'Connected' : 'Not connected'}
          </span>
          {status?.lastChecked && (
            <span className="ml-auto text-xs text-gray-400">
              Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
