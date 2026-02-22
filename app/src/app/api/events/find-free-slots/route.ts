import { NextRequest, NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate, endDate, durationMinutes, workdayStartHour, workdayEndHour, timezone } = body;

    if (!startDate || !endDate || !durationMinutes || !timezone) {
      return NextResponse.json(
        { error: 'startDate, endDate, durationMinutes, and timezone are required' },
        { status: 400 }
      );
    }

    // Reject timezone abbreviations — require IANA format
    if (/^[A-Z]{2,5}$/.test(timezone)) {
      return NextResponse.json(
        { error: `"${timezone}" is a timezone abbreviation. Use IANA format like America/New_York.` },
        { status: 400 }
      );
    }

    const slots = await composioProvider.findFreeSlots({
      startDate,
      endDate,
      durationMinutes: Number(durationMinutes),
      workdayStartHour: Number(workdayStartHour ?? 9),
      workdayEndHour: Number(workdayEndHour ?? 17),
      timezone,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to find free slots' },
      { status: 500 }
    );
  }
}
