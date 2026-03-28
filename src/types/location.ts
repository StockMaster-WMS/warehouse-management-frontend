import type { ApiResponse } from "@/types/api";

export interface Location {
  id: string;
  code?: string | null;
  zone?: string | null;
  aisle?: string | null;
  rack?: string | null;
  level?: string | number | null;
  bin?: string | null;
}

export type LocationResponse = ApiResponse<Location>;
