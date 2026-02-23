'use client';

import { useState } from 'react';
import CreateEventForm from './CreateEventForm';
import RescheduleForm from './RescheduleForm';
import DeleteEventForm from './DeleteEventForm';

type Tab = 'create' | 'reschedule' | 'delete';

export default function QuickActions() {
  const [tab, setTab] = useState<Tab>('create');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'create',     label: 'Create Event' },
    { id: 'reschedule', label: 'Reschedule' },
    { id: 'delete',     label: 'Delete' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? t.id === 'delete'
                  ? 'border-red-500 text-red-600'
                  : 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create'     && <CreateEventForm />}
      {tab === 'reschedule' && <RescheduleForm />}
      {tab === 'delete'     && <DeleteEventForm />}
    </div>
  );
}
