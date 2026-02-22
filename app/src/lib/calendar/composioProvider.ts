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

// Cached at module level — one instance per server process
let _toolset: ComposioToolSet | null = null;
function getToolset(): ComposioToolSet {
  if (!_toolset) {
    _toolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });
  }
  return _toolset;
}

async function execute(action: string, params: Record<string, unknown> = {}) {
  const toolset = getToolset();
  let lastError: Error | null = null;
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await toolset.executeAction({
      action,
      params,
      connectedAccountId: process.env.COMPOSIO_ACCOUNT_ID!,
    });

    if (result.successful) return result.data;

    const msg = result.error ?? `Action ${action} failed`;
    const isRetryable = isTransient(msg);

    // On final retry of a transient error, surface a retry-exhaustion message
    if (isRetryable && attempt === MAX_RETRIES - 1) {
      throw new Error(`Service temporarily unavailable after ${MAX_RETRIES} retries. ${friendlyError(msg)}`);
    }

    lastError = new Error(friendlyError(msg));
    if (!isRetryable) break;
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

// ---------- Timezone helpers ----------

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Convert a local ISO string (no Z, no offset) to a UTC Date in a given IANA timezone.
// e.g. localToUTC("2024-01-15T09:00:00", "America/Denver") → the UTC instant that
// corresponds to 9 AM Denver time on Jan 15.
function localToUTC(localISO: string, tz: string): Date {
  const trial = new Date(localISO + 'Z'); // treat as UTC to get a starting point
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(trial).map(({ type, value }) => [type, value])
  );
  const h = parts.hour === '24' ? 0 : +parts.hour;
  const tzEquiv = Date.UTC(+parts.year, +parts.month - 1, +parts.day, h, +parts.minute, +parts.second);
  return new Date(trial.getTime() + (trial.getTime() - tzEquiv));
}

function nextDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().split('T')[0];
}

// ---------- Free-slot computation ----------

function computeFreeSlots(
  busyPeriods: { start: string; end: string }[],
  params: FindFreeSlotsParams
): FreeSlot[] {
  const slots: FreeSlot[] = [];
  const tz = params.timezone;

  // Iterate days in the user's timezone (not server local time)
  const startDateStr = new Date(params.startDate).toLocaleDateString('en-CA', { timeZone: tz });
  const endDateStr   = new Date(params.endDate).toLocaleDateString('en-CA',   { timeZone: tz });

  const busy = busyPeriods
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentDateStr = startDateStr;
  while (currentDateStr <= endDateStr && slots.length < 5) {
    // Workday bounds as UTC instants for the user's timezone
    const dayStart = localToUTC(`${currentDateStr}T${pad(params.workdayStartHour)}:00:00`, tz);
    const dayEnd   = localToUTC(`${currentDateStr}T${pad(params.workdayEndHour)}:00:00`,   tz);

    let windowStart = new Date(dayStart);

    for (const period of busy) {
      if (period.start >= dayEnd) break; // sorted — nothing past dayEnd is relevant
      if (period.end <= windowStart) continue;
      const gapMs = period.start.getTime() - windowStart.getTime();
      if (gapMs >= params.durationMinutes * 60000) {
        slots.push({
          start: windowStart.toISOString(),
          end: new Date(windowStart.getTime() + params.durationMinutes * 60000).toISOString(),
          durationMinutes: params.durationMinutes,
        });
        if (slots.length >= 5) break;
      }
      if (period.end > windowStart) windowStart = new Date(period.end);
    }

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

    currentDateStr = nextDateStr(currentDateStr);
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
    if (params.timezone && !isValidIANATimezone(params.timezone)) {
      warnings.push(`Timezone "${params.timezone}" is not a valid IANA timezone.`);
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
      timezone: params.timezone,
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
