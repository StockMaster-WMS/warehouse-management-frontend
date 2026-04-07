import type { ApiResponse } from "@/types/api";

export interface Location {
  id: string;
  warehouseId: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  level: number;
  bin: string;
  locationType: string;
  maxWeightKg: number | null;
  maxVolumeCm3: number | null;
  pickSequence: number | null;
  status: string;
  isActive: boolean;
  isColdZone: boolean;
  isHazmatZone: boolean;
  isHeavyZone: boolean;
  createdAt: string;
}

export interface LocationSummary {
  id: string;
  code: string;
  name: string;
}

export interface CreateLocationRequest {
  warehouseId: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  level: number;
  bin: string;
  locationType?: string;
  maxWeightKg?: number;
  maxVolumeCm3?: number;
  pickSequence?: number;
  status?: string;
  isActive?: boolean;
  isColdZone?: boolean;
  isHazmatZone?: boolean;
  isHeavyZone?: boolean;
}

export type UpdateLocationRequest = CreateLocationRequest;

export type LocationResponse = ApiResponse<Location>;
