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

/** Full location option used for dropdowns & table display */
export interface LocationOption {
  id: string;
  warehouseId: string;
  code?: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  level?: number;
  bin?: string;
  locationType?: string;
  status?: string;
  isActive?: boolean;
  maxWeightKg?: number | null;
  maxVolumeCm3?: number | null;
  pickSequence?: number | null;
  isColdZone?: boolean | null;
  isHazmatZone?: boolean | null;
  isHeavyZone?: boolean | null;
}

export type LocationResponse = ApiResponse<Location>;

export type LocationListResponse = ApiResponse<LocationOption[]>;
