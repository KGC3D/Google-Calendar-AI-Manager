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
    if (/^[A-Z]{2,5}$/.test(params.timezone)) {
      return NextResponse.json(
        { error: `"${params.timezone}" is a timezone abbreviation. Use IANA format like America/New_York.` },
        { status: 400 }
      );
    }
    const preview = await composioProvider.previewCreateEvent(params);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
