import StatusCard from '@/components/StatusCard';
import FreeSlotForm from '@/components/FreeSlotForm';
import AuditLog from '@/components/AuditLog';
import EventList from '@/components/EventList';

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE ?? 'America/New_York';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar Copilot Lite</h1>
          <p className="text-sm text-gray-500">Timezone: {DEFAULT_TIMEZONE}</p>
        </div>

        {/* Connection Status */}
        <StatusCard />

        {/* Agenda */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming Events — Today + 7 Days
          </h2>
          <EventList events={[]} loading={false} timezone={DEFAULT_TIMEZONE} />
          <p className="mt-2 text-xs text-gray-400">
            Connect your calendar in Module 2 to see real events.
          </p>
        </section>

        {/* Free Slot Finder */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Free Slot Finder
          </h2>
          <FreeSlotForm defaultTimezone={DEFAULT_TIMEZONE} />
        </section>

        {/* Conflict Scanner */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Conflict Scanner
          </h2>
          <p className="text-sm text-gray-400">
            Conflict detection will be available after provider integration in Module 2.
          </p>
        </section>

        {/* Audit Log */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Audit Log
          </h2>
          <AuditLog />
        </section>
      </div>
    </main>
  );
}
