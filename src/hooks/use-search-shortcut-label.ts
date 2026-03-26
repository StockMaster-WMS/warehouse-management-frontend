"use client";

import { useEffect, useState } from "react";

/** Label for quick-search shortcut: ⌘K on Apple platforms, Ctrl+K elsewhere. */
export function useSearchShortcutLabel() {
  const [label, setLabel] = useState("Ctrl+K");

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const platform = typeof navigator !== "undefined" ? navigator.platform : "";
    const mac =
      /Mac|iPhone|iPad|iPod/i.test(platform) ||
      /Mac OS/i.test(ua);
    setLabel(mac ? "⌘K" : "Ctrl+K");
  }, []);

  return label;
}
