'use client';

import { useEffect, useState } from 'react';
import type { AuditEntry } from '@/lib/types';

export function appendAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
  const entries: AuditEntry[] = JSON.parse(localStorage.getItem('auditLog') ?? '[]');
  entries.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  // Keep last 100 entries
  localStorage.setItem('auditLog', JSON.stringify(entries.slice(0, 100)));
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    function load() {
      setEntries(JSON.parse(localStorage.getItem('auditLog') ?? '[]'));
    }
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  function clear() {
    localStorage.removeItem('auditLog');
    setEntries([]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-gray-400">{entries.length} action(s) logged</p>
        {entries.length > 0 && (
          <button onClick={clear} className="text-xs text-red-400 hover:underline">
            Clear log
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No actions logged yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id}
              className={`rounded-md border px-3 py-2 text-xs ${
                entry.status === 'success'
                  ? 'border-green-100 bg-green-50 text-green-800'
                  : 'border-red-100 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{entry.actionType}</span>
                <span className="text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="mt-0.5">{entry.summary}</p>
              {entry.errorMessage && <p className="mt-0.5 opacity-75">{entry.errorMessage}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
