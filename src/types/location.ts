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

export interface CreateLocationRequest {
  warehouseId: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  level: number;
  bin: string;
  locationType: string;
  isActive: boolean;
  isColdZone?: boolean;
  isHazmatZone?: boolean;
  isHeavyZone?: boolean;
}

export interface UpdateLocationRequest extends CreateLocationRequest {
  id: string;
}

export interface BulkGenerateLocationsRequest {
  warehouseId: string;
  warehouseCodePrefix?: string;
  areaCode?: string;
  zone: string;
  aislePrefix: string;
  aisleStart?: number;
  aisleCount: number;
  rackPrefix: string;
  rackStart?: number;
  rackCount: number;
  levelStart?: number;
  levelCount: number;
  binPrefix: string;
  binStart?: number;
  binCount: number;
  locationType?: string;
}

export type LocationResponse = ApiResponse<Location>;

export type LocationListResponse = ApiResponse<LocationOption[]>;
