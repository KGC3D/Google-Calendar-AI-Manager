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

// Stub implementation — real Composio API calls added in Module 2
class ComposioProvider implements ICalendarProvider {
  async checkConnection(): Promise<ConnectionStatus> {
    return {
      connected: false,
      lastChecked: new Date().toISOString(),
    };
  }

  async listEvents(_startDate: string, _endDate: string): Promise<EventSummary[]> {
    return [];
  }

  async findFreeSlots(_params: FindFreeSlotsParams): Promise<FreeSlot[]> {
    return [];
  }

  async previewCreateEvent(params: CreateEventParams): Promise<ActionPreview> {
    return {
      actionType: 'create',
      after: params,
      warnings: [],
    };
  }

  async confirmCreateEvent(_params: CreateEventParams): Promise<EventSummary> {
    throw new Error('Not implemented — requires Composio integration in Module 2');
  }

  async previewUpdateEvent(eventId: string, params: UpdateEventParams): Promise<ActionPreview> {
    return {
      actionType: 'update',
      before: { id: eventId },
      after: { id: eventId, ...params },
      warnings: [],
    };
  }

  async confirmUpdateEvent(_eventId: string, _params: UpdateEventParams): Promise<EventSummary> {
    throw new Error('Not implemented — requires Composio integration in Module 2');
  }

  async findConflicts(_startDate: string, _endDate: string): Promise<Conflict[]> {
    return [];
  }
}

export const composioProvider = new ComposioProvider();
