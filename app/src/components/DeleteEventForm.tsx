'use client';

import { useEffect, useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { appendAuditEntry } from './AuditLog';
import type { EventSummary } from '@/lib/types';

const REQUIRED_PHRASE = 'DELETE EVENT';

export default function DeleteEventForm() {
  const { timezone } = useTimezone();

  const [events,    setEvents]    = useState<EventSummary[]>([]);
  const [selected,  setSelected]  = useState<EventSummary | null>(null);
  const [phrase,    setPhrase]    = useState('');
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    const today    = new Date().toISOString();
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

  function fmtEvent(ev: EventSummary) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date(ev.start));
  }

  async function handleDelete() {
    if (!selected || phrase !== REQUIRED_PHRASE) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/events/delete-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selected.id, confirmation: phrase }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      appendAuditEntry({ actionType: 'delete', status: 'success', summary: `Deleted "${selected.summary}"` });
      setSuccess(`"${selected.summary}" deleted.`);
      setSelected(null);
      setPhrase('');
      setEvents((prev) => prev.filter((e) => e.id !== selected.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      appendAuditEntry({ actionType: 'delete', status: 'error', summary: `Failed to delete "${selected?.summary}"`, errorMessage: msg });
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }

  const confirmed = phrase === REQUIRED_PHRASE;

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-600 font-medium">Timezone: {timezone}</p>

      {success && <p className="text-sm text-green-600">{success}</p>}

      {!selected ? (
        <div>
          {events.length === 0
            ? <p className="text-sm text-gray-400">No upcoming events found.</p>
            : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-1">Select an event to delete:</p>
                {events.map((ev) => (
                  <button key={ev.id} onClick={() => { setSelected(ev); setPhrase(''); setError(''); setSuccess(''); }}
                    className="w-full text-left rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs hover:bg-red-50 hover:border-red-200">
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
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm font-medium text-red-800">{selected.summary}</p>
            <p className="text-xs text-red-600 mt-0.5">{fmtEvent(selected)}</p>
          </div>

          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            ⚠ This action is permanent and cannot be undone.
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">
              Type <span className="font-mono font-bold text-red-600">{REQUIRED_PHRASE}</span> to confirm deletion:
            </span>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={REQUIRED_PHRASE}
              className={`rounded border px-2 py-1 text-sm font-mono transition-colors ${
                phrase.length > 0 && !confirmed
                  ? 'border-red-300 bg-red-50'
                  : confirmed
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200'
              }`}
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => { setSelected(null); setPhrase(''); setError(''); }}
              className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {deleting ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
