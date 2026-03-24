import { useEffect, useState } from "react";

const DEFAULT_DELAY = 350;

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity. Useful for search inputs that trigger API calls.
 */
export function useDebouncedValue<T>(value: T, delay = DEFAULT_DELAY): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
