import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const { startDate, endDate } = await req.json();
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }
    const events = await composioProvider.listEvents(startDate, endDate);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list events' },
      { status: 500 }
    );
  }
}
