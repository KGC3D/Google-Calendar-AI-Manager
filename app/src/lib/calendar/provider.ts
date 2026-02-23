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

export interface ICalendarProvider {
  checkConnection(): Promise<ConnectionStatus>;
  listEvents(startDate: string, endDate: string): Promise<EventSummary[]>;
  findFreeSlots(params: FindFreeSlotsParams): Promise<FreeSlot[]>;
  previewCreateEvent(params: CreateEventParams): Promise<ActionPreview>;
  confirmCreateEvent(params: CreateEventParams): Promise<EventSummary>;
  previewUpdateEvent(eventId: string, params: UpdateEventParams): Promise<ActionPreview>;
  confirmUpdateEvent(eventId: string, params: UpdateEventParams): Promise<EventSummary>;
  findConflicts(startDate: string, endDate: string): Promise<Conflict[]>;
  deleteEvent(eventId: string): Promise<void>;
}
