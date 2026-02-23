'use client';

import { useEffect, useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { appendAuditEntry } from './AuditLog';
import ActionPreviewModal from './ActionPreviewModal';
import type { ActionPreview, EventSummary } from '@/lib/types';

export default function RescheduleForm() {
  const { timezone } = useTimezone();

  const [events,    setEvents]    = useState<EventSummary[]>([]);
  const [selected,  setSelected]  = useState<EventSummary | null>(null);
  const [newSummary, setNewSummary] = useState('');
  const [newStart,  setNewStart]  = useState('');
  const [newEnd,    setNewEnd]    = useState('');

  const [preview,    setPreview]    = useState<ActionPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // Fetch upcoming events to pick from
  useEffect(() => {
    const today   = new Date().toISOString();
    const in14Days = new Date(Date.now() + 14 * 86400000).toISOString();
    fetch('/api/events/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: today, endDate: in14Days }),
    })
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectEvent(ev: EventSummary) {
    setSelected(ev);
    setNewSummary(ev.summary);
    // Pre-fill datetime-local from ISO (strip seconds + Z)
    setNewStart(ev.start.slice(0, 16));
    setNewEnd(ev.end.slice(0, 16));
    setError('');
    setSuccess('');
    setPreview(null);
  }

  async function handlePreview() {
    if (!selected) return;
    setError('');
    setPreviewing(true);
    try {
      const res = await fetch('/api/events/update-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selected.id,
          summary: newSummary || undefined,
          start: newStart ? newStart + ':00' : undefined,
          end:   newEnd   ? newEnd   + ':00' : undefined,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirm() {
    if (!selected || !preview) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/events/update-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selected.id,
          summary: newSummary || undefined,
          start: newStart ? newStart + ':00' : undefined,
          end:   newEnd   ? newEnd   + ':00' : undefined,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      appendAuditEntry({ actionType: 'update', status: 'success', summary: `Updated "${selected.summary}"` });
      setSuccess(`Event updated successfully.`);
      setPreview(null);
      setSelected(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      appendAuditEntry({ actionType: 'update', status: 'error', summary: `Failed to update "${selected.summary}"`, errorMessage: msg });
      setError(msg);
      setPreview(null);
    } finally {
      setConfirming(false);
    }
  }

  function fmtEvent(ev: EventSummary) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date(ev.start));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-600 font-medium">Timezone: {timezone}</p>

      {/* Event picker */}
      {!selected ? (
        <div>
          {events.length === 0
            ? <p className="text-sm text-gray-400">No upcoming events found.</p>
            : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-1">Select an event to reschedule:</p>
                {events.map((ev) => (
                  <button key={ev.id} onClick={() => selectEvent(ev)}
                    className="w-full text-left rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs hover:bg-blue-50 hover:border-blue-200">
                    <span className="font-medium text-gray-800">{ev.summary}</span>
                    <span className="ml-2 text-gray-400">{fmtEvent(ev)}</span>
                  </button>
                ))}
              </div>
            )
          }
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
            <span className="text-sm font-medium text-blue-800">{selected.summary}</span>
            <button onClick={() => { setSelected(null); setPreview(null); setError(''); setSuccess(''); }}
              className="text-xs text-blue-500 hover:underline">Change</button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <label className="col-span-full flex flex-col gap-1">
              <span className="text-xs text-gray-500">New title (leave blank to keep)</span>
              <input value={newSummary} onChange={(e) => setNewSummary(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">New start ({timezone})</span>
              <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">New end ({timezone})</span>
              <input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1" />
            </label>
          </div>

          {error   && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button onClick={handlePreview} disabled={previewing || confirming}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {previewing ? 'Generating preview...' : 'Preview Changes'}
          </button>
        </div>
      )}

      {preview && (
        <ActionPreviewModal
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={() => setPreview(null)}
          confirming={confirming}
        />
      )}
    </div>
  );
}
