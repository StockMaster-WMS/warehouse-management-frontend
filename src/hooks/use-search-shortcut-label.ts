"use client";

import { useSyncExternalStore } from "react";

/** Label for quick-search shortcut: ⌘K on Apple platforms, Ctrl+K elsewhere. */
function getShortcutSnapshot() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  const mac =
    /Mac|iPhone|iPad|iPod/i.test(platform) ||
    /Mac OS/i.test(ua);

  return mac ? "⌘K" : "Ctrl+K";
}

function getServerShortcutSnapshot() {
  return "Ctrl+K";
}

function subscribeToShortcutSnapshot(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(id);
}

export function useSearchShortcutLabel() {
  return useSyncExternalStore(
    subscribeToShortcutSnapshot,
    getShortcutSnapshot,
    getServerShortcutSnapshot,
  );
}
