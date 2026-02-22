import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const { eventId, ...params } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }
    const preview = await composioProvider.previewUpdateEvent(eventId, params);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate update preview' },
      { status: 500 }
    );
  }
}
