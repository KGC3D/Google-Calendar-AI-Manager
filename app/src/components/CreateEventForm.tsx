'use client';

import { useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { appendAuditEntry } from './AuditLog';
import ActionPreviewModal from './ActionPreviewModal';
import type { ActionPreview } from '@/lib/types';

export default function CreateEventForm() {
  const { timezone } = useTimezone();

  const [summary,     setSummary]     = useState('');
  const [start,       setStart]       = useState('');
  const [end,         setEnd]         = useState('');
  const [description, setDescription] = useState('');
  const [location,    setLocation]    = useState('');
  const [attendees,   setAttendees]   = useState('');

  const [preview,     setPreview]     = useState<ActionPreview | null>(null);
  const [previewing,  setPreviewing]  = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  function buildParams() {
    return {
      summary,
      start: start + ':00',           // datetime-local → add seconds
      end: end + ':00',
      timezone,
      description: description || undefined,
      location: location || undefined,
      attendees: attendees ? attendees.split(',').map((e) => e.trim()).filter(Boolean) : undefined,
    };
  }

  async function handlePreview() {
    setError('');
    setSuccess('');
    if (!summary || !start || !end) {
      setError('Title, start, and end are required.');
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch('/api/events/create-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildParams()),
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
    if (!preview) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/events/create-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildParams()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      appendAuditEntry({ actionType: 'create', status: 'success', summary: `Created "${summary}"` });
      setSuccess(`Event "${data.summary}" created successfully.`);
      setPreview(null);
      setSummary(''); setStart(''); setEnd(''); setDescription(''); setLocation(''); setAttendees('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      appendAuditEntry({ actionType: 'create', status: 'error', summary: `Failed to create "${summary}"`, errorMessage: msg });
      setError(msg);
      setPreview(null);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-600 font-medium">Timezone: {timezone}</p>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <label className="col-span-full flex flex-col gap-1">
          <span className="text-xs text-gray-500">Event title *</span>
          <input value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="Team standup"
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Start ({timezone}) *</span>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">End ({timezone}) *</span>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="Conference room / Zoom link"
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Attendees (comma-separated emails)</span>
          <input value={attendees} onChange={(e) => setAttendees(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
            className="rounded border border-gray-200 px-2 py-1" />
        </label>
        <label className="col-span-full flex flex-col gap-1">
          <span className="text-xs text-gray-500">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="Agenda, notes..."
            className="rounded border border-gray-200 px-2 py-1 resize-none" />
        </label>
      </div>

      {error   && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button onClick={handlePreview} disabled={previewing || confirming}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {previewing ? 'Generating preview...' : 'Preview Event'}
      </button>

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
