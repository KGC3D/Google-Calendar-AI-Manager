'use client';

import { useTimezone } from '@/contexts/TimezoneContext';
import { PRIORITY_TIMEZONES, TIMEZONE_GROUPS } from '@/lib/timezones';

export default function TimezoneSelector() {
  const { timezone, setTimezone } = useTimezone();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tz-select" className="text-xs font-medium text-gray-500 whitespace-nowrap">
        Timezone
      </label>
      <select
        id="tz-select"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Priority zones at top */}
        <optgroup label="── Priority ──">
          {PRIORITY_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </optgroup>

        {/* All regions */}
        {TIMEZONE_GROUPS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.zones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
