import { ComposioToolSet } from 'composio-core';
import type { ICalendarProvider } from './provider';
import type {
  ConnectionStatus,
  EventSummary,
  FindFreeSlotsParams,
  FreeSlot,
  CreateEventParams,
  UpdateEventParams,
  ActionPreview,
  Conflict,
} from '@/lib/types';

// ---------- Composio client singleton ----------

function getToolset() {
  return new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });
}

async function execute(action: string, params: Record<string, unknown> = {}) {
  const toolset = getToolset();
  let lastError: Error | null = null;

  // Retry up to 3 times for transient errors
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await toolset.executeAction({
      action,
      params,
      connectedAccountId: process.env.COMPOSIO_ACCOUNT_ID!,
    });

    if (result.successful) return result.data;

    const msg = result.error ?? `Action ${action} failed`;
    lastError = new Error(friendlyError(msg));

    // Only retry on transient errors
    if (!isTransient(msg)) break;
    await sleep(500 * 2 ** attempt);
  }

  throw lastError;
}

function friendlyError(msg: string): string {
  if (msg.includes('401')) return 'Calendar not authorized — check your Composio connection.';
  if (msg.includes('403')) return 'Access denied — make sure calendar permissions were granted.';
  if (msg.includes('429')) return 'Rate limit hit — please wait a moment and try again.';
  return msg;
}

function isTransient(msg: string) {
  return msg.includes('429') || msg.includes('500') || msg.includes('503');
}

function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Response normalizers ----------

interface GCalEvent {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email?: string }[];
  location?: string;
  conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] };
}

function normalizeEvent(ev: GCalEvent): EventSummary {
  const meetEntry = ev.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === 'video'
  );
  return {
    id: ev.id ?? '',
    summary: ev.summary ?? '(No title)',
    start: ev.start?.dateTime ?? ev.start?.date ?? '',
    end: ev.end?.dateTime ?? ev.end?.date ?? '',
    attendeesCount: ev.attendees?.length ?? 0,
    location: ev.location,
    meetLink: meetEntry?.uri,
  };
}

// ---------- Free-slot computation ----------

function computeFreeSlots(
  busyPeriods: { start: string; end: string }[],
  params: FindFreeSlotsParams
): FreeSlot[] {
  const slots: FreeSlot[] = [];
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  const busy = busyPeriods
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const cursor = new Date(start);
  while (cursor <= end && slots.length < 5) {
    // Build fresh day boundaries from cursor each iteration — no carryover between days
    const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), params.workdayStartHour, 0, 0, 0);
    const dayEnd   = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), params.workdayEndHour,   0, 0, 0);

    // Reset windowStart to the start of this workday on every iteration
    let windowStart = new Date(dayStart);

    for (const period of busy) {
      if (period.end <= windowStart || period.start >= dayEnd) continue;
      const gapMs = period.start.getTime() - windowStart.getTime();
      if (gapMs >= params.durationMinutes * 60000) {
        slots.push({
          start: windowStart.toISOString(),
          end: new Date(windowStart.getTime() + params.durationMinutes * 60000).toISOString(),
          durationMinutes: params.durationMinutes,
        });
        if (slots.length >= 5) break;
      }
      if (period.end > windowStart) windowStart = period.end;
    }

    // Check remaining gap after last busy period
    if (slots.length < 5) {
      const gapMs = dayEnd.getTime() - windowStart.getTime();
      if (gapMs >= params.durationMinutes * 60000) {
        slots.push({
          start: windowStart.toISOString(),
          end: new Date(windowStart.getTime() + params.durationMinutes * 60000).toISOString(),
          durationMinutes: params.durationMinutes,
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

// ---------- Provider implementation ----------

class ComposioProvider implements ICalendarProvider {
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      await execute('GOOGLECALENDAR_GET_CURRENT_DATE_TIME', { timezone: 'UTC' });
      return { connected: true, lastChecked: new Date().toISOString() };
    } catch {
      return { connected: false, lastChecked: new Date().toISOString() };
    }
  }

  async listEvents(startDate: string, endDate: string): Promise<EventSummary[]> {
    const data = await execute('GOOGLECALENDAR_EVENTS_LIST', {
      calendarId: 'primary',
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    const items = (data as { items?: GCalEvent[] }).items ?? [];
    return items.map(normalizeEvent);
  }

  async findFreeSlots(params: FindFreeSlotsParams): Promise<FreeSlot[]> {
    const data = await execute('GOOGLECALENDAR_FREE_BUSY_QUERY', {
      items: [{ id: 'primary' }],
      timeMin: new Date(params.startDate).toISOString(),
      timeMax: new Date(params.endDate).toISOString(),
      timeZone: params.timezone,
    });
    const busy =
      (data as { calendars?: { primary?: { busy?: { start: string; end: string }[] } } })
        .calendars?.primary?.busy ?? [];
    return computeFreeSlots(busy, params);
  }

  async previewCreateEvent(params: CreateEventParams): Promise<ActionPreview> {
    const warnings: string[] = [];
    if (new Date(params.end) <= new Date(params.start)) {
      warnings.push('End time is before or equal to start time.');
    }
    if (!isValidIANATimezone(params.timezone)) {
      warnings.push(`Timezone "${params.timezone}" is not a valid IANA timezone.`);
    }
    return { actionType: 'create', after: params, warnings };
  }

  async confirmCreateEvent(params: CreateEventParams): Promise<EventSummary> {
    const data = await execute('GOOGLECALENDAR_CREATE_EVENT', {
      calendar_id: 'primary',
      summary: params.summary,
      start_datetime: params.start,
      end_datetime: params.end,
      description: params.description,
      location: params.location,
      attendees: params.attendees?.map((email) => ({ email })),
      timezone: params.timezone,
    });
    return normalizeEvent(data as GCalEvent);
  }

  async previewUpdateEvent(eventId: string, params: UpdateEventParams): Promise<ActionPreview> {
    const data = await execute('GOOGLECALENDAR_EVENTS_GET', {
      event_id: eventId,
      calendar_id: 'primary',
    });
    const before = normalizeEvent(data as GCalEvent);
    const warnings: string[] = [];
    if (params.start && params.end && new Date(params.end) <= new Date(params.start)) {
      warnings.push('End time is before or equal to start time.');
    }
    return {
      actionType: 'update',
      before,
      after: { ...before, ...params },
      warnings,
    };
  }

  async confirmUpdateEvent(eventId: string, params: UpdateEventParams): Promise<EventSummary> {
    const data = await execute('GOOGLECALENDAR_PATCH_EVENT', {
      event_id: eventId,
      calendar_id: 'primary',
      summary: params.summary,
      start_datetime: params.start,
      end_datetime: params.end,
      description: params.description,
      location: params.location,
      attendees: params.attendees?.map((email) => ({ email })),
    });
    return normalizeEvent(data as GCalEvent);
  }

  async findConflicts(startDate: string, endDate: string): Promise<Conflict[]> {
    const events = await this.listEvents(startDate, endDate);
    const conflicts: Conflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i];
        const b = events[j];
        const aStart = new Date(a.start).getTime();
        const aEnd = new Date(a.end).getTime();
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();

        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);

        if (overlapEnd > overlapStart) {
          conflicts.push({
            eventA: a,
            eventB: b,
            overlapMinutes: Math.round((overlapEnd - overlapStart) / 60000),
          });
        }
      }
    }

    return conflicts;
  }
}

export const composioProvider = new ComposioProvider();
