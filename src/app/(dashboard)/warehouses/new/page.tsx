"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewWarehousePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/warehouses");
  }, [router]);

  return null;
}
