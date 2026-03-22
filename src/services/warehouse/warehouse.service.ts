import { axiosInstance } from "@/lib/axios-instance";
import type {
  Warehouse,
  WarehouseApiResponse,
  WarehouseListData,
  WarehouseListParams,
  WarehouseListResponse,
  WarehouseSummary,
  WarehouseSummaryResponse,
} from "@/types/warehouse";

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;
const DEFAULT_SORT = "createdAt" as const;
const DEFAULT_SORT_DIR = "desc" as const;

function normalizeSize(size?: number): number {
  if (typeof size !== "number" || Number.isNaN(size)) {
    return DEFAULT_SIZE;
  }
  return Math.max(1, Math.min(100, Math.trunc(size)));
}

function normalizePage(page?: number): number {
  if (typeof page !== "number" || Number.isNaN(page)) {
    return DEFAULT_PAGE;
  }
  return Math.max(0, Math.trunc(page));
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapWarehouseRow(row: WarehouseApiResponse): Warehouse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    timezone: row.timezone,
    address: row.address,
    location: row.address,
    managerName: row.managerName ?? undefined,
    zonesCount: row.zonesCount,
    binsCount: row.binsCount,
    fillRatePercent: row.fillRatePercent,
    capacityPercent: row.fillRatePercent,
  };
}

function mapWarehouseSummary(raw: unknown): WarehouseSummary {
  const source = (raw ?? {}) as Partial<WarehouseSummary>;
  return {
    totalWarehouses: toNumber(source.totalWarehouses, 0),
    activeWarehouses: toNumber(source.activeWarehouses, 0),
    inactiveWarehouses: toNumber(source.inactiveWarehouses, 0),
    warehousesWithStock: toNumber(source.warehousesWithStock, 0),
    highFillRateWarehouses: toNumber(source.highFillRateWarehouses, 0),
  };
}

function mapWarehouseListData(raw: unknown): WarehouseListData {
  const source = (raw ?? {}) as Partial<WarehouseListData> & {
    content?: WarehouseApiResponse[];
    totalElements?: number;
    totalPages?: number;
  };

  const rows = Array.isArray(source.content) ? source.content : [];

  return {
    content: rows.map(mapWarehouseRow),
    page: toNumber(source.page, DEFAULT_PAGE),
    size: toNumber(source.size, DEFAULT_SIZE),
    total_elements: toNumber(source.total_elements ?? source.totalElements, 0),
    total_pages: toNumber(source.total_pages ?? source.totalPages, 0),
  };
}

export function buildWarehouseListParams(params: WarehouseListParams = {}) {
  const normalized: Record<string, string | number | boolean> = {
    page: normalizePage(params.page),
    size: normalizeSize(params.size),
    sort: params.sort ?? DEFAULT_SORT,
    sortDir: params.sortDir ?? DEFAULT_SORT_DIR,
  };

  if (params.keyword?.trim()) {
    normalized.keyword = params.keyword.trim();
  }

  if (typeof params.isActive === "boolean") {
    normalized.isActive = params.isActive;
  }

  if (params.timezone?.trim()) {
    normalized.timezone = params.timezone.trim();
  }

  return normalized;
}

export async function getWarehouseList(
  params: WarehouseListParams = {},
): Promise<WarehouseListData> {
  const response = await axiosInstance.get<WarehouseListResponse>(
    "/warehouses",
    {
      params: buildWarehouseListParams(params),
    },
  );

  const mapped = mapWarehouseListData(response.data?.data);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[warehouse.service] raw response", response.data);
    console.debug("[warehouse.service] mapped result", mapped);
  }

  return mapped;
}

export async function getWarehouseSummary(): Promise<WarehouseSummary> {
  const response = await axiosInstance.get<WarehouseSummaryResponse>(
    "/warehouses/summary",
  );

  const mapped = mapWarehouseSummary(response.data?.data);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[warehouse.service] raw summary", response.data);
    console.debug("[warehouse.service] mapped summary", mapped);
  }

  return mapped;
}
