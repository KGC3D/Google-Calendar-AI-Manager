import StatusCard from '@/components/StatusCard';
import FreeSlotForm from '@/components/FreeSlotForm';
import AuditLog from '@/components/AuditLog';
import EventListContainer from '@/components/EventListContainer';
import TimezoneSelector from '@/components/TimezoneSelector';
import ConflictScanner from '@/components/ConflictScanner';
import QuickActions from '@/components/QuickActions';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar Copilot Lite</h1>
            <p className="text-xs text-gray-400">All times shown in your selected timezone</p>
          </div>
          <TimezoneSelector />
        </div>

        {/* Connection Status */}
        <StatusCard />

        {/* Agenda */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming Events — Today + 7 Days
          </h2>
          <EventListContainer />
        </section>

        {/* Quick Actions */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Quick Actions
          </h2>
          <QuickActions />
        </section>

        {/* Free Slot Finder */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Free Slot Finder
          </h2>
          <FreeSlotForm />
        </section>

        {/* Conflict Scanner */}
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Conflict Scanner
          </h2>
          <ConflictScanner />
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
