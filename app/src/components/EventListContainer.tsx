'use client';

import { useEffect, useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import EventList from './EventList';
import type { EventSummary } from '@/lib/types';

export default function EventListContainer() {
  const { timezone } = useTimezone();
  const [events,  setEvents]  = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const today   = new Date().toISOString();
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString();

    fetch('/api/events/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: today, endDate: in7Days }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvents(data.events ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // Empty deps is intentional — events are returned in UTC and don't change with timezone.
  // timezone is only used by EventList for display formatting; it re-renders automatically
  // when context updates without needing a refetch.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return <EventList events={events} loading={loading} timezone={timezone} />;
}
