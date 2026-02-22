'use client';

import { useState } from 'react';
import type { FreeSlot } from '@/lib/types';

interface FreeSlotFormProps {
  defaultTimezone: string;
}

export default function FreeSlotForm({ defaultTimezone }: FreeSlotFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [duration, setDuration] = useState(30);
  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(17);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFind() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/events/find-free-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          durationMinutes: duration,
          workdayStartHour: workStart,
          workdayEndHour: workEnd,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to find slots');
      setSlots(data.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
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
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Duration (minutes)</span>
          <input type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Timezone (IANA)</span>
          <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Work start (hour)</span>
          <input type="number" min={0} max={23} value={workStart} onChange={(e) => setWorkStart(Number(e.target.value))}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Work end (hour)</span>
          <input type="number" min={0} max={23} value={workEnd} onChange={(e) => setWorkEnd(Number(e.target.value))}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
      </div>

      <button onClick={handleFind} disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Finding slots...' : 'Find Free Slots'}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {slots.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Available slots ({timezone})</p>
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs text-gray-700">
              <span>{new Date(slot.start).toLocaleString()} – {new Date(slot.end).toLocaleTimeString()}</span>
              <span className="text-gray-400">{slot.durationMinutes} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
