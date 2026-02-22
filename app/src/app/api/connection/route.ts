import { NextResponse } from 'next/server';
import { composioProvider } from '@/lib/calendar/composioProvider';

export async function GET() {
  try {
    const status = await composioProvider.checkConnection();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { connected: false, lastChecked: new Date().toISOString(), error: 'Connection check failed' },
      { status: 500 }
    );
  }
}
