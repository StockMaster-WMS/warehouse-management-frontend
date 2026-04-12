"use client";

import { useEffect, useCallback } from "react";

/**
 * Cảnh báo khi user rời trang có dữ liệu chưa lưu.
 * - `beforeunload` cho F5 / đóng tab.
 * - Trả về `confirmLeave()` để page tự gọi khi user bấm Back/navigate.
 *   (Next.js App Router không hỗ trợ `useBlocker` kiểu React Router,
 *    nên page sẽ dùng `confirmLeave()` trong onClick hoặc Link wrapper.)
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmLeave = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm(
      "Bạn có dữ liệu chưa lưu. Bạn có chắc muốn rời trang?",
    );
  }, [isDirty]);

  return { confirmLeave };
}
