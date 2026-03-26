import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/** Luôn false trên server và trong lần hydrate đầu — tránh lệch cây render / useId (Base UI). */
function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      onStoreChange();
    };
    mql.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
