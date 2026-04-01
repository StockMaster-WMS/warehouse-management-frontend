"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Package, Archive, CheckCircle2, AlertTriangle, Eye, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useGetPickingItemsQuery, useGetPickingItemByIdQuery } from "@/store/services/picking-item.service";

export function OverviewTab() {
    const [filter, setFilter] = useState<string>("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data, isLoading } = useGetPickingItemsQuery({
        status: filter === "all" ? undefined : filter.toUpperCase()
    });

    const { data: detailData, isFetching: isDetailLoading } = useGetPickingItemByIdQuery(
        selectedId as string,
        { skip: !selectedId }
    );
    const detailItem = detailData?.data;

    const pickingItems = data?.data?.content || [];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Đơn đang chờ lấy"
                    value="12 Wave"
                    icon={Package}
                    trend="Đã xác nhận từ Sales"
                    accentClassName="text-blue-500 bg-blue-100"
                />
                <StatCard
                    label="Đang thực hiện"
                    value="5 Wave"
                    icon={Archive}
                    trend="Nhân viên đang pick"
                    accentClassName="text-amber-500 bg-amber-100"
                />
                <StatCard
                    label="Đã hoàn tất"
                    value="48 Đơn"
                    icon={CheckCircle2}
                    trend="Sẵn sàng đóng gói"
                    accentClassName="text-emerald-500 bg-emerald-100"
                />
                <StatCard
                    label="Có ngoại lệ"
                    value="2 Lỗi"
                    icon={AlertTriangle}
                    trend="Cần Supervisor check"
                    accentClassName="text-rose-500 bg-rose-100"
                />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row border-b pb-4 mt-2">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input placeholder="Tìm kiếm Wave, SO, Tên nhân viên..." className="pl-9" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <Tabs defaultValue="all" className="w-100" onValueChange={setFilter}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">Tất cả</TabsTrigger>
                                <TabsTrigger value="pending">Chờ Pick</TabsTrigger>
                                <TabsTrigger value="picked">Hoàn tất</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="pl-4">Mã Picking</TableHead>
                                <TableHead>Đơn Bán (SO)</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>Vị trí kho</TableHead>
                                <TableHead>Tiến độ (Qty)</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right pr-4">Tác vụ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</TableCell>
                                </TableRow>
                            ) : pickingItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">Không có dữ liệu picking</TableCell>
                                </TableRow>
                            ) : pickingItems.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="pl-4 font-medium">{row.id.slice(0, 8)}...</TableCell>
                                    <TableCell className="text-slate-500">{row.salesOrderNumber || row.soItemId}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm">{row.productSku || row.productId}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{row.productName}</div>
                                    </TableCell>
                                    <TableCell>{row.locationCode || row.locationName || row.locationId}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{row.qtyPicked || 0}/{row.qtyToPick}</span>
                                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full ${row.status === "PICKED" ? "bg-emerald-500" : "bg-blue-500"}`}
                                                    style={{ width: `${Math.round(((row.qtyPicked || 0) / row.qtyToPick) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                row.status === "PICKED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                                "border-blue-200 bg-blue-50 text-blue-700"
                                            }
                                        >
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 gap-1 text-indigo-600"
                                            onClick={() => setSelectedId(row.id)}
                                        >
                                            <Eye className="h-4 w-4" /> Chi tiết
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ngoại lệ & Lỗi (Exceptions)</CardTitle>
                    <CardDescription>Lỗi báo cáo từ máy Scan: Short Pick, Wrong Location, v.v.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-slate-500">
                        [Danh sách chờ xử lý từ Quản lý kho]
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
                <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                        <DialogTitle>Chi tiết Picking Line</DialogTitle>
                        <DialogDescription>
                            {selectedId && <>Mã hệ thống: {selectedId}</>}
                        </DialogDescription>
                    </DialogHeader>

                    {isDetailLoading ? (
                        <div className="py-8 text-center text-slate-500">Đang tải dữ liệu...</div>
                    ) : detailItem ? (
                        <div className="grid gap-4 py-4 text-sm">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium text-slate-500">Đơn Bán:</span>
                                <span className="col-span-3 font-semibold">{detailItem.salesOrderNumber}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <span className="font-medium text-slate-500">Sản phẩm:</span>
                                <span className="col-span-3 flex flex-col">
                                    <span className="font-bold">{detailItem.productSku}</span>
                                    <span className="text-slate-600 truncate">{detailItem.productName}</span>
                                    <span className="text-xs text-slate-400 mt-0.5">Danh mục: {detailItem.categoryName || "-"}</span>
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                                <span className="font-medium text-slate-500">Vị trí Pick:</span>
                                <span className="col-span-3 font-bold text-blue-600">
                                    {detailItem.locationCode} 
                                    {detailItem.zone && <span className="text-slate-500 font-normal ml-2">({detailItem.zone} - {detailItem.aisle})</span>}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium text-slate-500">Lô (Lot):</span>
                                <span className="col-span-3">
                                    {detailItem.lotNumber ? (
                                        <Badge variant="secondary">{detailItem.lotNumber}</Badge>
                                    ) : (
                                        <span className="text-slate-400">Không yêu cầu</span>
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t py-4 mt-2">
                                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-xs text-slate-500 mb-1">Cần lấy</span>
                                    <span className="text-xl font-bold">{detailItem.qtyToPick}</span>
                                    <span className="text-xs text-slate-400 mt-1">{detailItem.baseUnit}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-emerald-50 rounded-lg text-emerald-700">
                                    <span className="text-xs text-emerald-600 mb-1">Đã lấy</span>
                                    <span className="text-xl font-bold">{detailItem.qtyPicked || 0}</span>
                                    <span className="text-xs text-emerald-600/70 mt-1">{detailItem.baseUnit}</span>
                                </div>
                            </div>
                            
                            <div className="text-center text-xs text-slate-400">
                                <p>Tồn kho hiện tại ở vị trí này: <span className="font-semibold">{detailItem.qtyAvailable ?? "..."}</span> {detailItem.baseUnit}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-rose-500">Không thể tải chi tiết, vui lòng thử lại!</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
