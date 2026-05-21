import {
    CheckCircle2,
    CircleOff,
    MapPin,
    MoreHorizontal,
    Pencil,
    Trash2,
    Warehouse,
    Printer,
    ShoppingCart,
    Package,
    ArrowDownToLine,
    Truck,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatLocationZoneLine } from "@/components/features/locations/utils";
import type { Location, LocationOption } from "@/types/location";
import { Progress } from "@/components/ui/progress";

function LocationTypeBadge({ type }: { type?: string | null }) {
    if (!type) return <Badge variant="outline">Chưa phân loại</Badge>;
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('pick')) {
        return <Badge variant="secondary" className="flex w-max items-center gap-1.5"><ShoppingCart className="h-3 w-3" /> {type}</Badge>;
    }
    if (lowerType.includes('reser') || lowerType.includes('stor')) {
        return <Badge variant="outline" className="flex w-max items-center gap-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"><Package className="h-3 w-3" /> {type}</Badge>;
    }
    if (lowerType.includes('receiv')) {
        return <Badge className="flex w-max items-center gap-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 border-none dark:bg-blue-900/30 dark:text-blue-300"><ArrowDownToLine className="h-3 w-3" /> {type}</Badge>;
    }
    if (lowerType.includes('dispatch') || lowerType.includes('ship')) {
        return <Badge className="flex w-max items-center gap-1.5 bg-orange-100 text-orange-800 hover:bg-orange-200 border-none dark:bg-orange-900/30 dark:text-orange-300"><Truck className="h-3 w-3" /> {type}</Badge>;
    }
    return <Badge variant="outline">{type}</Badge>;
}

function CapacityCell({ location }: { location: Location | LocationOption }) {
    const status = location.status?.toUpperCase();

    const config: Record<string, { label: string; value: number; barClass: string; textClass: string }> = {
        AVAILABLE: { label: "Còn trống", value: 0,   barClass: "[&>div]:bg-emerald-400", textClass: "text-emerald-600" },
        RESERVED:  { label: "Đã giữ chỗ", value: 60,  barClass: "[&>div]:bg-amber-400",  textClass: "text-amber-600" },
        OCCUPIED:  { label: "Đã dùng",  value: 100, barClass: "[&>div]:bg-rose-500",   textClass: "text-rose-600" },
    };

    const cfg = config[status ?? ""] ?? { label: status ?? "--", value: 0, barClass: "", textClass: "text-slate-400" };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                <span>{cfg.label}</span>
                {status && <span className={cfg.textClass}>{cfg.value}%</span>}
            </div>
            <Progress value={cfg.value} className={`h-1.5 ${cfg.barClass}`} />
            {(location.maxWeightKg != null || location.maxVolumeCm3 != null) && (
                <span className="text-[9px] text-slate-400 leading-none">
                    {location.maxWeightKg != null && <>{location.maxWeightKg} kg</>}
                    {location.maxWeightKg != null && location.maxVolumeCm3 != null && " · "}
                    {location.maxVolumeCm3 != null && <>{location.maxVolumeCm3} cm³</>}
                </span>
            )}
        </div>
    );
}

type LocationsTableProps = {
    visibleLocations: Location[];
    warehouseNameMap: Record<string, string>;
    page: number;
    totalPages: number;
    totalElements: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    isLoading: boolean;
    errorMessage?: string | null;
    isFetching: boolean;
    pageSize: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    onPageSizeChange?: (size: number) => void;
    onRetry?: () => void;
    onEdit: (location: Location) => void;
    onDelete: (location: Location) => void;
    onBulkDelete?: (locations: Location[]) => Promise<void> | void;
    onPrintBarcode: (location: Location) => void;
    canManageLocations?: boolean;
};

export function LocationsTable({
    visibleLocations,
    warehouseNameMap,
    page,
    totalPages,
    totalElements,
    canGoPrev,
    canGoNext,
    isLoading,
    errorMessage,
    isFetching,
    pageSize,
    onPrevPage,
    onNextPage,
    onPageSizeChange,
    onRetry,
    onEdit,
    onDelete,
    onBulkDelete,
    onPrintBarcode,
    canManageLocations = false,
}: LocationsTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const selectedLocations = useMemo(
        () => visibleLocations.filter((location) => selectedIds.has(location.id)),
        [selectedIds, visibleLocations],
    );
    const allVisibleSelected = visibleLocations.length > 0 && selectedLocations.length === visibleLocations.length;

    const toggleLocation = (locationId: string, checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            if (checked) next.add(locationId);
            else next.delete(locationId);
            return next;
        });
    };

    const toggleAllVisible = (checked: boolean) => {
        setSelectedIds((current) => {
            const next = new Set(current);
            visibleLocations.forEach((location) => {
                if (checked) next.add(location.id);
                else next.delete(location.id);
            });
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (!onBulkDelete || selectedLocations.length === 0) return;
        await onBulkDelete(selectedLocations);
        clearSelection();
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {canManageLocations && selectedLocations.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50/60 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon-sm" onClick={clearSelection} className="h-7 w-7">
                            <X className="h-4 w-4" />
                        </Button>
                        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                            Đã chọn {selectedLocations.length.toLocaleString("vi-VN")} vị trí
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled className="border-indigo-100 bg-white/70">
                            Sửa loại vị trí
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-rose-100 bg-white/70 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={handleBulkDelete}
                            disabled={!onBulkDelete}
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Xóa đã chọn
                        </Button>
                    </div>
                </div>
            ) : null}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/70 dark:bg-slate-800/50">
                            <TableHead className="w-10 px-4 py-3">
                                {canManageLocations ? (
                                    <Checkbox
                                        checked={allVisibleSelected}
                                        onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                                        aria-label="Chọn tất cả vị trí đang hiển thị"
                                    />
                                ) : null}
                            </TableHead>
                            <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-[30%]">Vị trí</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-[22%]">Kho & Vùng</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-[14%]">Phân loại</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-[16%]">TT</TableHead>
                            <TableHead className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={`location-table-skeleton-${index}`}>
                                    <TableCell className="px-4 py-3"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                                    <TableCell className="px-4 py-3"><div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-52" /></div></TableCell>
                                    <TableCell className="px-4 py-3"><div className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-16 rounded-full" /></div></TableCell>
                                    <TableCell className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                    <TableCell className="px-4 py-3"><div className="space-y-1.5"><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                    <TableCell className="px-4 py-3"><div className="ml-auto flex w-max gap-1"><Skeleton className="h-8 w-14 rounded-md" /><Skeleton className="h-8 w-14 rounded-md" /><Skeleton className="h-8 w-14 rounded-md" /></div></TableCell>
                                </TableRow>
                            ))
                        ) : errorMessage ? (
                            <TableRow>
                                <TableCell colSpan={6} className="px-4 py-8 text-center">
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Không thể tải danh sách vị trí</p>
                                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
                                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>Thử lại</Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleLocations.map((location) => {
                                const warehouseName = warehouseNameMap[location.warehouseId];
                                const locationCode = location.code || "--";
                                const crumbs = [
                                    location.zone,
                                    location.aisle,
                                    location.rack,
                                    location.level != null ? `L${String(location.level).padStart(2, "0")}` : null,
                                    location.bin,
                                ].filter(Boolean).join(" › ");

                                return (
                                    <TableRow key={location.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                        <TableCell className="px-4 py-3 align-middle">
                                            {canManageLocations ? (
                                                <Checkbox
                                                    checked={selectedIds.has(location.id)}
                                                    onCheckedChange={(checked) => toggleLocation(location.id, checked === true)}
                                                    aria-label={`Chọn vị trí ${locationCode}`}
                                                />
                                            ) : null}
                                        </TableCell>
                                        {/* Col 1: Location code + breadcrumb */}
                                        <TableCell className="px-4 py-3">
                                            <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{locationCode}</p>
                                            {crumbs && <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate max-w-[260px]">{crumbs}</p>}
                                        </TableCell>

                                        {/* Col 2: Warehouse + zone badges */}
                                        <TableCell className="px-4 py-3">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{warehouseName || "Chưa xác định"}</p>
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                {location.isColdZone && <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200">🧊 COLD</span>}
                                                {location.isHazmatZone && <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-200">⚠️ HAZMAT</span>}
                                                {location.isHeavyZone && <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-200">🏋️ HEAVY</span>}
                                                {!location.isColdZone && !location.isHazmatZone && !location.isHeavyZone && location.zone && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{location.zone}</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Col 3: Type */}
                                        <TableCell className="px-4 py-3">
                                            <LocationTypeBadge type={location.locationType} />
                                        </TableCell>

                                        {/* Col 4: Capacity + active state */}
                                        <TableCell className="px-4 py-3 min-w-[140px]">
                                            <CapacityCell location={location} />
                                            <div className="mt-2 flex items-center gap-1">
                                                {location.isActive === false
                                                    ? <><CircleOff className="h-3 w-3 text-rose-400" /><span className="text-[10px] text-rose-500">Ngừng dùng</span></>
                                                    : <><CheckCircle2 className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-emerald-500">Đang hoạt động</span></>
                                                }
                                            </div>
                                        </TableCell>

                                        {/* Col 5: Actions - 3-dot menu */}
                                        <TableCell className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    {canManageLocations ? (
                                                        <DropdownMenuItem onClick={() => onEdit(location)}>
                                                            <Pencil className="mr-2 h-3.5 w-3.5" />Sửa
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuItem onClick={() => onPrintBarcode(location)} className="text-indigo-600 focus:text-indigo-600">
                                                        <Printer className="mr-2 h-3.5 w-3.5" />In mã vạch
                                                    </DropdownMenuItem>
                                                    {canManageLocations ? (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => onDelete(location)} className="text-rose-600 focus:text-rose-600">
                                                                <Trash2 className="mr-2 h-3.5 w-3.5" />Xóa
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : null}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                              key={`location-card-skeleton-${index}`}
                              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                          >
                              <div className="space-y-3">
                                  <Skeleton className="h-5 w-32" />
                                  <Skeleton className="h-4 w-44" />
                                  <Skeleton className="h-4 w-36" />
                                  <div className="flex gap-2 pt-1">
                                      <Skeleton className="h-8 w-16 rounded-md" />
                                      <Skeleton className="h-8 w-16 rounded-md" />
                                  </div>
                              </div>
                          </div>
                      ))
                    : errorMessage ? (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
                              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                  Không thể tải danh sách vị trí
                              </p>
                              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
                              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                                  Thử lại
                              </Button>
                          </div>
                      ) : (
                          visibleLocations.map((location) => {
                              const warehouseName = warehouseNameMap[location.warehouseId];
                              const locationCode = location.code || "--";

                              return (
                                  <div
                                      key={location.id}
                                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
                                  >
                                      <div className="flex items-start justify-between gap-3">
                                          <div>
                                              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                                  {locationCode}
                                              </p>
                                          </div>
                                          <Badge variant={location.isActive === false ? "secondary" : "default"}>
                                              {location.isActive === false ? "Ngừng dùng" : "Đang dùng"}
                                          </Badge>
                                      </div>

                                      <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                          <p className="flex items-center gap-2">
                                              <Warehouse className="h-3.5 w-3.5" />
                                              {warehouseName || "Kho chưa xác định"}
                                          </p>
                                          <p className="flex items-center gap-2 font-mono">
                                              <MapPin className="h-3.5 w-3.5" />
                                              {formatLocationZoneLine(location)}
                                          </p>
                                      </div>

                                      <div className="mt-4 flex flex-wrap items-center gap-2">
                                          <Badge variant="outline">Ô kệ: {location.bin || "-"}</Badge>
                                          <Badge variant="outline">Tầng: {location.level ?? "-"}</Badge>
                                          <LocationTypeBadge type={location.locationType} />
                                      </div>

                                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                                          <div className="flex w-1/2 flex-col gap-1.5">
                                              <CapacityCell location={location} />
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                              {canManageLocations ? (
                                                  <Button type="button" variant="outline" size="icon" onClick={() => onEdit(location)}>
                                                      <Pencil className="h-3.5 w-3.5" />
                                                  </Button>
                                              ) : null}
                                              <Button type="button" variant="outline" size="icon" onClick={() => onPrintBarcode(location)} className="text-indigo-600">
                                                  <Printer className="h-3.5 w-3.5" />
                                              </Button>
                                              {canManageLocations ? (
                                                  <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="icon"
                                                      className="text-rose-600 hover:text-rose-600"
                                                      onClick={() => onDelete(location)}
                                                  >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                  </Button>
                                              ) : null}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })
                      )}
            </div>

            <PaginationFooter
                itemLabel="vị trí"
                rowsCount={isLoading ? pageSize : visibleLocations.length}
                page={page}
                totalElements={totalElements}
                totalPages={totalPages}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                isFetching={isFetching}
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
}
