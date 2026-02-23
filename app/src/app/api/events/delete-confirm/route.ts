import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const { eventId, confirmation } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }
    if (confirmation !== 'DELETE EVENT') {
      return NextResponse.json(
        { error: 'Confirmation phrase must be exactly: DELETE EVENT' },
        { status: 400 }
      );
    }
    await composioProvider.deleteEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    );
  }
}
