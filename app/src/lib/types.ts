export interface UserSettings {
  timezone: string;
  workdayStartHour: number;
  workdayEndHour: number;
  defaultDurationMinutes: number;
}

export interface EventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendeesCount: number;
  location?: string;
  meetLink?: string;
}

export interface ActionPreview {
  actionType: 'create' | 'update' | 'delete';
  before?: object;
  after: object;
  warnings: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actionType: string;
  status: 'success' | 'error';
  summary: string;
  errorMessage?: string;
}

export interface FindFreeSlotsParams {
  startDate: string;
  endDate: string;
  durationMinutes: number;
  workdayStartHour: number;
  workdayEndHour: number;
  timezone: string;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface CreateEventParams {
  summary: string;
  start: string;
  end: string;
  timezone: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface UpdateEventParams {
  summary?: string;
  start?: string;
  end?: string;
  timezone?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface Conflict {
  eventA: EventSummary;
  eventB: EventSummary;
  overlapMinutes: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastChecked: string;
}
