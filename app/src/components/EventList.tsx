'use client';

import type { EventSummary } from '@/lib/types';

interface EventListProps {
  events: EventSummary[];
  loading: boolean;
  timezone: string;
}

export default function EventList({ events, loading, timezone }: EventListProps) {
  if (loading) return <p className="text-sm text-gray-400">Loading events...</p>;
  if (events.length === 0) return <p className="text-sm text-gray-400">No upcoming events.</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Times shown in {timezone}</p>
      {events.map((event) => (
        <div
          key={event.id}
          className="flex flex-col gap-1 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
        >
          <span className="text-sm font-medium text-gray-800">{event.summary}</span>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>
              {new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleTimeString()}
            </span>
            {event.attendeesCount > 0 && <span>{event.attendeesCount} attendee(s)</span>}
            {event.location && <span>{event.location}</span>}
            {event.meetLink && (
              <a href={event.meetLink} className="text-blue-500 underline" target="_blank" rel="noreferrer">
                Join
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
