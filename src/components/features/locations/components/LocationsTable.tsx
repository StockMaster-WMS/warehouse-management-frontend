import {
    CheckCircle2,
    CircleOff,
    MapPin,
    Pencil,
    Trash2,
    Warehouse,
    Printer,
    ShoppingCart,
    Package,
    ArrowDownToLine,
    Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { LOCATIONS_PAGE_SIZE } from "@/components/features/locations/constants";
import { formatLocationZoneLine } from "@/components/features/locations/utils";
import type { LocationOption } from "@/types/purchase-order";
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

// Hàm tính nhanh % lấp đầy giả lập dựa vào ID để giao diện demo sống động
function getCapacitySeed(id: string): number {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 101; 
}

type LocationsTableProps = {
    visibleLocations: LocationOption[];
    warehouseNameMap: Record<string, string>;
    page: number;
    totalPages: number;
    totalElements: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    isLoading: boolean;
    errorMessage?: string | null;
    isFetching: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    onRetry?: () => void;
    onEdit: (location: LocationOption) => void;
    onDelete: (location: LocationOption) => void;
    onPrintBarcode: (location: LocationOption) => void;
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
    onPrevPage,
    onNextPage,
    onRetry,
    onEdit,
    onDelete,
    onPrintBarcode,
}: LocationsTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-3 py-3 text-center">Mã vị trí</TableHead>
                            <TableHead className="px-3 py-3">Kho</TableHead>
                            <TableHead className="px-3 py-3">Khu vực</TableHead>
                            <TableHead className="px-3 py-3 text-center">Bin / Level</TableHead>
                            <TableHead className="px-3 py-3">Loại</TableHead>
                            <TableHead className="px-3 py-3">Sức chứa</TableHead>
                            <TableHead className="px-3 py-3 text-center">Trạng thái</TableHead>
                            <TableHead className="px-3 py-3 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={`location-table-skeleton-${index}`}>
                                    <TableCell className="px-3 py-3">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24 mx-auto" />
                                            <Skeleton className="h-3 w-32 mx-auto" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-4 w-28 mx-auto" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-2 w-20 mb-1 rounded-full" />
                                        <Skeleton className="h-3 w-8" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </TableCell>
                                    <TableCell className="px-3 py-3">
                                        <div className="ml-auto flex w-max gap-2">
                                            <Skeleton className="h-8 w-16 rounded-md" />
                                            <Skeleton className="h-8 w-16 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : errorMessage ? (
                            <TableRow>
                                <TableCell colSpan={8} className="px-4 py-8 text-center">
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                        Không thể tải danh sách vị trí
                                    </p>
                                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errorMessage}</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={onRetry}
                                    >
                                        Thử lại
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleLocations.map((location) => {
                                const warehouseName = warehouseNameMap[location.warehouseId];
                                const locationCode = location.code || location.name || "--";

                                return (
                                    <TableRow key={location.id}>
                                        <TableCell className="px-3 py-3 text-center align-top">
                                            <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                                {locationCode}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 align-top">
                                            <span className="text-xs text-slate-700 dark:text-slate-200">
                                                {warehouseName || "Kho chưa xác định"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 align-top">
                                            <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                                                {formatLocationZoneLine(location)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 text-center align-top">
                                            <span className="text-xs text-slate-700 dark:text-slate-200">
                                                Bin {location.bin || "-"} / Lv {location.level ?? "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 align-top">
                                            <LocationTypeBadge type={location.locationType} />
                                        </TableCell>
                                        <TableCell className="px-3 py-3 align-top min-w-[120px]">
                                            <div className="flex flex-col gap-1.5 w-full">
                                                <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                                                    <span>Lấp đầy</span>
                                                    <span className={getCapacitySeed(location.id) > 90 ? "text-rose-600" : ""}>{getCapacitySeed(location.id)}%</span>
                                                </div>
                                                <Progress value={getCapacitySeed(location.id)} className="h-1.5" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 text-center align-top">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                                                {location.isActive === false ? (
                                                    <>
                                                        <CircleOff className="h-3.5 w-3.5 text-rose-500" />
                                                        <span className="text-rose-600 dark:text-rose-300">Ngừng dùng</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                        <span className="text-emerald-600 dark:text-emerald-300">Đang dùng</span>
                                                    </>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 py-3 text-right align-top">
                                            <div className="inline-flex items-center gap-1">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(location)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Sửa
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => onPrintBarcode(location)} className="text-indigo-600 hover:text-indigo-600">
                                                    <Printer className="h-3.5 w-3.5" />
                                                    In Barcode
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-rose-600 hover:text-rose-600"
                                                    onClick={() => onDelete(location)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Xóa
                                                </Button>
                                            </div>
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
                              const locationCode = location.code || location.name || "--";

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
                                          <Badge variant="outline">Bin: {location.bin || "-"}</Badge>
                                          <Badge variant="outline">Level: {location.level ?? "-"}</Badge>
                                          <LocationTypeBadge type={location.locationType} />
                                      </div>

                                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                                          <div className="flex w-1/2 flex-col gap-1.5">
                                              <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                                                  <span>Lấp đầy</span>
                                                  <span className={getCapacitySeed(location.id) > 90 ? "text-rose-600" : ""}>{getCapacitySeed(location.id)}%</span>
                                              </div>
                                              <Progress value={getCapacitySeed(location.id)} className="h-1.5 w-full" />
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                              <Button type="button" variant="outline" size="icon" onClick={() => onEdit(location)}>
                                                  <Pencil className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button type="button" variant="outline" size="icon" onClick={() => onPrintBarcode(location)} className="text-indigo-600">
                                                  <Printer className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  className="text-rose-600 hover:text-rose-600"
                                                  onClick={() => onDelete(location)}
                                              >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })
                      )}
            </div>

            <PaginationFooter
                itemLabel="vị trí"
                rowsCount={isLoading ? LOCATIONS_PAGE_SIZE : visibleLocations.length}
                page={page}
                totalElements={totalElements}
                totalPages={totalPages}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                isFetching={isFetching}
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                pageSize={LOCATIONS_PAGE_SIZE}
            />
        </div>
    );
}
