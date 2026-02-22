'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'calcopilot_timezone';
const FALLBACK_TZ = 'America/New_York';

interface TimezoneContextValue {
  timezone: string;
  setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextValue>({
  timezone: FALLBACK_TZ,
  setTimezone: () => {},
});

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>(FALLBACK_TZ);

  // Load from localStorage on mount, fall back to env default or browser
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTimezoneState(stored);
    } else {
      // Use the env default if set, otherwise detect browser timezone
      const envDefault = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
      const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezoneState(envDefault ?? browserTZ ?? FALLBACK_TZ);
    }
  }, []);

  function setTimezone(tz: string) {
    setTimezoneState(tz);
    localStorage.setItem(STORAGE_KEY, tz);
  }

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  return useContext(TimezoneContext);
}
