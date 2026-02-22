import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();
    if (!params.summary || !params.start || !params.end || !params.timezone) {
      return NextResponse.json(
        { error: 'summary, start, end, and timezone are required' },
        { status: 400 }
      );
    }
    const event = await composioProvider.confirmCreateEvent(params);
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    );
  }
}
