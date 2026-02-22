import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const { eventId, ...params } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }
    const event = await composioProvider.confirmUpdateEvent(eventId, params);
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    );
  }
}
