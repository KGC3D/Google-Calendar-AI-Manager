'use client';

import { useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import type { Conflict } from '@/lib/types';

function fmtDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

export default function ConflictScanner() {
  const { timezone } = useTimezone();

  const today   = new Date().toISOString().split('T')[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [startDate,  setStartDate]  = useState(today);
  const [endDate,    setEndDate]    = useState(in7Days);
  const [conflicts,  setConflicts]  = useState<Conflict[] | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  async function handleScan() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/events/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setConflicts(data.conflicts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-600 font-medium">Using timezone: {timezone}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">End date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
      </div>

      <button onClick={handleScan} disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Scanning...' : 'Scan for Conflicts'}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {conflicts !== null && conflicts.length === 0 && (
        <p className="text-sm text-green-600">No conflicts found in this range.</p>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-red-500 font-medium">{conflicts.length} conflict(s) found</p>
          {conflicts.map((c, i) => (
            <div key={i} className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
              <p className="font-medium">{c.eventA.summary} ↔ {c.eventB.summary}</p>
              <p className="text-red-600 mt-0.5">
                {fmtDateTime(c.eventA.start, timezone)} — overlaps by {c.overlapMinutes} min
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
