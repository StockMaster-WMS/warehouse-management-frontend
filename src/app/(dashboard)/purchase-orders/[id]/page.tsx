"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import {
  Loader2,
  CheckCircle2,
  Ban,
  Trash2,
  PackagePlus,
  ClipboardCheck,
  Building2,
  Warehouse,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  PackageCheck,
  TrendingUp,
  ReceiptText,
  Activity,
  DollarSign,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { apiErrMessage, apiErrStatus } from "@/types/api";
import {
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useCompletePutawayTaskMutation,
  useAddPurchaseOrderItemMutation,
  useDeletePoItemMutation,
  useDeletePurchaseOrderMutation,
  useGetProductsForPoQuery,
  useGetPurchaseOrderDetailQuery,
  useGetWarehousesForPoQuery,
  useUpdatePurchaseOrderMutation,
} from "@/store/services/purchase-order.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import {
  useCreateInboundReceiptMutation,
  useGetInboundReceiptsByPoQuery,
  useLazyGetInboundLocationSuggestionsQuery,
} from "@/store/services/inbound.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ADMIN_MANAGER_ROLES, INBOUND_RECEIVE_ROLES } from "@/lib/access-control";
import { PermissionControl, useHasPermissions } from "@/components/permission-control";
import type { PutawayTask } from "@/types/purchase-order";
import type { InboundLocationSuggestion, InboundReceipt } from "@/types/inbound-receipt";
import {
  DetailErrorState,
  DetailPageHeader,
  DetailPageLayout,
  DetailStatusBadge,
  DetailSummaryGrid,
  DetailSummaryItem,
  type StatusConfig,
} from "@/components/detail-page";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PoLinesSection } from "@/components/features/PoLinesSection";
import type { Product } from "@/types/product";
import type { PoItem } from "@/types/purchase-order";

const viDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function inboundLocationOption(loc: InboundLocationSuggestion) {
  const zoneLabel = loc.zone ? ` - Zone ${loc.zone}` : "";
  const typeLabel = loc.locationType ?? "STORAGE";
  const stockQty = loc.qtyOnHand ?? 0;

  if (loc.existingProductLocation) {
    return {
      value: loc.locationId,
      label: `${loc.locationCode} - Đang có SP (${stockQty})${zoneLabel}`,
      hint: `Vị trí sẵn có của sản phẩm · ${typeLabel}`,
    };
  }

  return {
    value: loc.locationId,
    label: `${loc.locationCode} - ${typeLabel}${zoneLabel}`,
    hint: loc.emptyLocation
      ? "Vị trí trống"
      : `Vị trí phù hợp · Tồn hiện tại: ${stockQty}`,
  };
}

function formatDateTime(value?: string | null) {
  return value ? viDateTimeFormatter.format(new Date(value)) : "—";
}

/* ── Status configs ────────────────────────────────────────────────── */
const PO_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: "Nháp", color: "slate" },
  APPROVED: { label: "Đã duyệt", color: "blue" },
  PARTIAL: { label: "Nhận một phần", color: "amber" },
  COMPLETED: { label: "Hoàn tất", color: "emerald" },
  CANCELLED: { label: "Đã hủy", color: "rose" },
};

const GRN_STATUS: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: "Đã nhận", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  PUTAWAY_IN_PROGRESS: { label: "Đang lên kệ", cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  CANCELLED: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
};

const PUTAWAY_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ xếp kệ", cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  IN_PROGRESS: { label: "Đang xếp", cls: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  CANCELLED: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
};

function StatusPill({ map, value, fallback }: {
  map: Record<string, { label: string; cls: string }>;
  value: string | null | undefined;
  fallback?: string;
}) {
  const cfg = map[value ?? ""];
  if (!cfg) return <span className="text-xs text-slate-400">{value ?? fallback ?? "—"}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

const completeSchema = z.object({
  actualLocationId: z.string().min(1, "Chọn vị trí thực tế"),
});

const headerSchema = z.object({
  supplierId: z.string().min(1, "Chọn nhà cung cấp"),
  warehouseId: z.string().min(1, "Chọn kho"),
  orderDate: z.string().min(1, "Chọn ngày đặt"),
  expectedDate: z.string().optional(),
  totalAmountStr: z.string().optional(),
});

const lineSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  orderedQtyStr: z.string().min(1, "Nhập số lượng"),
  unitPriceStr: z.string().optional(),
});

/* ── InfoRow helper ─────────────────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3.5 border-b border-border py-3.5 last:border-0">
      <div className="ui-icon-tile size-8 group-hover:text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="ui-label">{label}</p>
        <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</div>
      </div>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/35" />
    </div>
  );
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const canManagePurchaseOrder = useHasPermissions(ADMIN_MANAGER_ROLES);
  const canReceiveInbound = useHasPermissions(INBOUND_RECEIVE_ROLES);

  const {
    data: detailRes,
    isLoading: detailLoading,
    isError: detailError,
    error: detailLoadError,
    refetch,
  } = useGetPurchaseOrderDetailQuery(id, { skip: !id });

  const { data: receiptsRes } = useGetInboundReceiptsByPoQuery(id, { skip: !id });

  /* ── GRN dialog state ── */
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnNote, setGrnNote] = useState("");
  const [grnLines, setGrnLines] = useState<{ poItemId: string; receivedQty: string; locationId: string; note: string }[]>([]);
  const [grnLocationSuggestions, setGrnLocationSuggestions] = useState<Record<string, InboundLocationSuggestion[]>>({});
  const [grnLocationLoading, setGrnLocationLoading] = useState<Record<string, boolean>>({});

  /* ── Putaway dialog state ── */
  const [putawayOpen, setPutawayOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<PutawayTask | null>(null);
  const [actualLocationId, setActualLocationId] = useState("");
  const [putawayErrors, setPutawayErrors] = useState<Record<string, string>>({});

  /* ── Draft editing state ── */
  const [editHeaderOpen, setEditHeaderOpen] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState("");
  const [editOrderDate, setEditOrderDate] = useState("");
  const [editExpectedDate, setEditExpectedDate] = useState("");
  const [editTotalAmountStr, setEditTotalAmountStr] = useState("");
  const [editHeaderErrors, setEditHeaderErrors] = useState<Record<string, string>>({});
  const [lineProductId, setLineProductId] = useState("");
  const [lineQty, setLineQty] = useState("");
  const [linePrice, setLinePrice] = useState("");
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch.trim());

  /* ── Mutations ── */
  const [approvePo, { isLoading: approvingPo }] = useApprovePurchaseOrderMutation();
  const [cancelPo, { isLoading: cancellingPo }] = useCancelPurchaseOrderMutation();
  const [deletePo, { isLoading: deletingPo }] = useDeletePurchaseOrderMutation();
  const [updatePo, { isLoading: updatingPo }] = useUpdatePurchaseOrderMutation();
  const [addPurchaseOrderItem, { isLoading: savingLine }] = useAddPurchaseOrderItemMutation();
  const [deleteLine, { isLoading: deletingLine }] = useDeletePoItemMutation();
  const [createGrn, { isLoading: creatingGrn }] = useCreateInboundReceiptMutation();
  const [loadInboundLocationSuggestions] = useLazyGetInboundLocationSuggestionsQuery();
  const [completePutawayTask, { isLoading: completingPutaway }] = useCompletePutawayTaskMutation();

  const detail = detailRes?.data;
  const po = detail?.purchaseOrder;
  const items = useMemo(() => detail?.items ?? [], [detail?.items]);
  const tasks = useMemo(() => detail?.putawayTasks ?? [], [detail?.putawayTasks]);
  const progress = detail?.progress;
  const receipts: InboundReceipt[] = receiptsRes?.data ?? [];

  const computedTotal = items.reduce((sum, row) => {
    return sum + Number(row.orderedQty ?? 0) * Number(row.unitPrice ?? 0);
  }, 0);
  const displayTotal =
    po?.totalAmount != null && po.totalAmount > 0
      ? po.totalAmount
      : computedTotal > 0 ? computedTotal : null;

  const poStatus = po?.status ?? "";
  const isDraft = poStatus === "DRAFT";
  const canEditDraftLines = isDraft && (canManagePurchaseOrder || canReceiveInbound);
  const canApprove = canManagePurchaseOrder && isDraft && items.length > 0;
  const canReceive = canReceiveInbound && (poStatus === "APPROVED" || poStatus === "PARTIAL");
  const canCancel = canManagePurchaseOrder && (poStatus === "DRAFT" || poStatus === "APPROVED");

  /* ── Warehouses & Suppliers ── */
  const { data: warehousesRes } = useGetWarehousesForPoQuery({ size: 200 });
  const warehouses = warehousesRes?.data?.content ?? [];
  const warehouseName =
    po?.warehouseName || warehouses.find((w) => w.id === po?.warehouseId)?.name || po?.warehouseId || "—";

  const { data: suppliersRes } = useGetSuppliersQuery({ page: 0, size: 200 });
  const suppliers = useMemo(() => suppliersRes?.data?.content ?? [], [suppliersRes?.data?.content]);
  const supplierName =
    po?.supplierName || suppliers.find((s) => s.id === po?.supplierId)?.name || po?.supplierId || "—";
  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
      hint: [supplier.code, supplier.contactPhone, supplier.contactEmail].filter(Boolean).join(" · "),
    })),
    [suppliers],
  );

  const { data: productsRes, isFetching: productsLoading, isError: productsErr } = useGetProductsForPoQuery({
    ...(debouncedProductSearch ? { keyword: debouncedProductSearch } : {}),
  });
  const { data: allProductsRes } = useGetProductsForPoQuery({ size: 200 });
  const products = useMemo(
    () =>
      (productsRes?.data?.content ?? []).map((product: Product) => ({
        id: String(product.id),
        sku: product.sku,
        name: product.name,
      })),
    [productsRes],
  );
  const productOptions = useMemo(
    () => products.map((product) => ({
      value: product.id,
      label: product.name,
      hint: product.sku,
    })),
    [products],
  );
  const productNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of allProductsRes?.data?.content ?? []) {
      map.set(String(product.id), product.name);
    }
    for (const product of products) {
      map.set(product.id, product.name);
    }
    return map;
  }, [allProductsRes, products]);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === lineProductId),
    [lineProductId, products],
  );
  /* ── Locations ── */
  const selectedWhId = po?.warehouseId ?? "";
  const { data: whLocRes } = useGetLocationsListQuery(
    { warehouseId: selectedWhId, size: 100 },
    { skip: !selectedWhId }
  );
  const locationOptions = Array.isArray(whLocRes?.data?.content)
    ? whLocRes.data.content
    : Array.isArray(whLocRes?.data)
      ? whLocRes.data
      : [];

  /* ── Open GRN dialog ── */
  function openGrn() {
    const lines: { poItemId: string; receivedQty: string; locationId: string; note: string }[] = [];
    for (const item of items) {
      if (Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0) > 0) {
        lines.push({ poItemId: item.id, receivedQty: "", locationId: "", note: "" });
      }
    }
    setGrnLines(lines);
    setGrnLocationSuggestions({});
    setGrnLocationLoading({});
    setGrnNote("");
    setGrnOpen(true);
  }

  function updateGrnLine(poItemId: string, field: "receivedQty" | "locationId" | "note", value: string) {
    setGrnLines((prev) => prev.map((l) => l.poItemId === poItemId ? { ...l, [field]: value } : l));
  }

  async function loadGrnLineLocations(poItemId: string) {
    if (!poItemId || grnLocationSuggestions[poItemId]?.length || grnLocationLoading[poItemId]) {
      return;
    }
    setGrnLocationLoading((prev) => ({ ...prev, [poItemId]: true }));
    try {
      const res = await loadInboundLocationSuggestions({
        poItemId,
        limit: 20,
      }).unwrap();
      setGrnLocationSuggestions((prev) => ({ ...prev, [poItemId]: res.data ?? [] }));
      if ((res.data ?? []).length === 0) {
        console.info("Không có vị trí phù hợp cho poItemId", poItemId);
      }
    } catch (err) {
      toast.error(apiErrMessage(err, "Không tải được gợi ý vị trí nhập hàng"));
    } finally {
      setGrnLocationLoading((prev) => ({ ...prev, [poItemId]: false }));
    }
  }

  function grnLocationOptions(poItemId: string) {
    return [...(grnLocationSuggestions[poItemId] ?? [])]
      .sort((left, right) => Number(Boolean(right.existingProductLocation)) - Number(Boolean(left.existingProductLocation)))
      .map(inboundLocationOption);
  }

  function openEditHeaderDialog() {
    if (!po || !isDraft || !canManagePurchaseOrder) return;
    setEditSupplierId(po.supplierId ?? "");
    setEditWarehouseId(po.warehouseId ?? "");
    setEditOrderDate(po.orderDate ?? "");
    setEditExpectedDate(po.expectedDate ?? "");
    setEditTotalAmountStr(po.totalAmount != null ? String(po.totalAmount) : "");
    setEditHeaderErrors({});
    setEditHeaderOpen(true);
  }

  async function handleUpdateHeader(e: React.FormEvent) {
    e.preventDefault();
    if (!po || !isDraft || !canManagePurchaseOrder) return;
    setEditHeaderErrors({});
    const parsed = headerSchema.safeParse({
      supplierId: editSupplierId,
      warehouseId: editWarehouseId,
      orderDate: editOrderDate,
      expectedDate: editExpectedDate || undefined,
      totalAmountStr: editTotalAmountStr,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setEditHeaderErrors(nextErrors);
      toast.error(nextErrors.supplierId ?? nextErrors.warehouseId ?? nextErrors.orderDate ?? "Kiểm tra thông tin đơn nhập");
      return;
    }

    let totalAmount: number | null | undefined;
    if (parsed.data.totalAmountStr?.trim()) {
      const value = Number(parsed.data.totalAmountStr.replace(",", "."));
      if (Number.isNaN(value)) {
        setEditHeaderErrors({ totalAmountStr: "Tổng tiền không hợp lệ" });
        toast.error("Tổng tiền không hợp lệ");
        return;
      }
      totalAmount = value;
    } else {
      totalAmount = null;
    }

    try {
      const res = await updatePo({
        id: po.id,
        body: {
          supplierId: parsed.data.supplierId,
          warehouseId: parsed.data.warehouseId,
          orderDate: parsed.data.orderDate,
          expectedDate: parsed.data.expectedDate?.trim() || null,
          totalAmount,
        },
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Cập nhật đơn nhập thất bại");
        return;
      }
      toast.success("Đã cập nhật đơn nhập");
      setEditHeaderOpen(false);
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể cập nhật đơn nhập"));
    }
  }

  async function handleAddLine(e: React.FormEvent) {
    e.preventDefault();
    if (!po || !canEditDraftLines) return;
    setLineErrors({});
    const parsed = lineSchema.safeParse({
      productId: lineProductId,
      orderedQtyStr: lineQty,
      unitPriceStr: linePrice,
    });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setLineErrors(nextErrors);
      toast.error("Kiểm tra dòng hàng");
      return;
    }

    const qty = Number(parsed.data.orderedQtyStr.replace(",", "."));
    if (!(qty > 0) || Number.isNaN(qty)) {
      setLineErrors({ orderedQtyStr: "Số lượng phải > 0" });
      toast.error("Số lượng phải > 0");
      return;
    }

    if (!selectedProduct) {
      setLineErrors({ productId: "Chọn sản phẩm hợp lệ" });
      toast.error("Chọn sản phẩm hợp lệ");
      return;
    }

    let unitPrice: number | undefined;
    if (parsed.data.unitPriceStr?.trim()) {
      const value = Number(parsed.data.unitPriceStr.replace(",", "."));
      if (!Number.isNaN(value)) unitPrice = value;
    }

    try {
      const res = await addPurchaseOrderItem({
        purchaseOrderId: po.id,
        productId: selectedProduct.id,
        productSku: selectedProduct.sku,
        productName: selectedProduct.name,
        orderedQty: qty,
        unitPrice: unitPrice ?? 0,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Thêm dòng thất bại");
        return;
      }
      toast.success("Đã thêm dòng hàng vào đơn nhập.");
      setLineProductId("");
      setLineQty("");
      setLinePrice("");
      refetch();
    } catch (err) {
      const message = apiErrMessage(err, "Không thể thêm dòng hàng");
      if (message.includes("DRAFT") || message.includes("Nháp")) {
        toast.error("Chỉ có thể thêm/sửa dòng hàng khi đơn nhập đang ở trạng thái Nháp.");
      } else if (message.includes("trùng") || message.includes("tồn tại")) {
        toast.error("Số dòng đã tồn tại.");
      } else {
        toast.error(message);
      }
    }
  }

  async function handleDeleteLine(item: PoItem) {
    if (!po || !canEditDraftLines) return;
    try {
      const res = await deleteLine({ id: item.id, purchaseOrderId: po.id }).unwrap();
      if (!res.success) {
        toast.error((res as { message?: string }).message || "Xóa dòng thất bại");
        return;
      }
      toast.success("Đã xóa dòng");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xóa dòng hàng"));
    }
  }

  /* ── Actions ── */
  async function handleApprove() {
    if (!id) return;
    if (items.length === 0) {
      toast.error("Cần thêm ít nhất một dòng hàng trước khi duyệt đơn nhập.");
      return;
    }
    try {
      const res = await approvePo(id).unwrap();
      if (!res.success) { toast.error(res.message || "Duyệt đơn nhập thất bại"); return; }
      toast.success(res.message || "Đã duyệt đơn nhập"); refetch();
    } catch (err) {
      toast.error(
        apiErrStatus(err) === 403 || apiErrStatus(err) === "403"
          ? "Bạn chưa được phân quyền thao tác kho của đơn nhập này"
          : apiErrMessage(err),
      );
    }
  }

  async function handleCancel() {
    if (!id) return;
    try {
      const res = await cancelPo(id).unwrap();
      if (!res.success) { toast.error(res.message || "Hủy đơn nhập thất bại"); return; }
      toast.success(res.message || "Đã hủy đơn nhập"); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      const res = await deletePo(id).unwrap();
      if (!res.success) { toast.error((res as { message?: string }).message || "Xóa thất bại"); return; }
      toast.success("Đã xóa đơn nhập");
      window.location.href = "/purchase-orders";
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  async function handleSubmitGrn(e: React.FormEvent) {
    e.preventDefault();
    const validLines: { poItemId: string; receivedQty: number; locationId: string; note?: string }[] = [];
    const itemsById = new Map(items.map((item) => [item.id, item]));
    for (const line of grnLines) {
      const qty = Number(line.receivedQty.replace(",", "."));
      if (!qty || Number.isNaN(qty) || qty <= 0) continue;
      if (!line.locationId.trim()) {
        const item = itemsById.get(line.poItemId);
        toast.error(`Vui lòng chọn vị trí nhập cho ${item?.productSku ?? "dòng hàng"}`);
        return;
      }
      validLines.push({
        poItemId: line.poItemId,
        receivedQty: qty,
        locationId: line.locationId.trim(),
        ...(line.note.trim() ? { note: line.note.trim() } : {}),
      });
    }

    if (validLines.length === 0) { toast.error("Nhập số lượng ít nhất 1 dòng hàng"); return; }

    for (const line of validLines) {
      const item = itemsById.get(line.poItemId);
      if (!item) continue;
      const remain = Number(item.orderedQty ?? 0) - Number(item.receivedQty ?? 0);
      if (line.receivedQty > remain) {
        toast.error(`${item.productSku}: nhập (${line.receivedQty}) > còn lại (${remain})`);
        return;
      }
    }

    try {
      const res = await createGrn({
        purchaseOrderId: id,
        locationId: null,
        ...(grnNote.trim() ? { note: grnNote.trim() } : {}),
        items: validLines,
      }).unwrap();
      if (!res.success) { toast.error(res.message || "Tạo phiếu nhập kho thất bại"); return; }
      toast.success(`Đã tạo phiếu nhập kho: ${res.data?.receiptNumber ?? "OK"}`);
      setGrnOpen(false); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  /* ── Putaway ── */
  function openPutaway(task: PutawayTask) {
    setActiveTask(task);
    setActualLocationId(task.actualLocationId ?? task.suggestedLocationId ?? "");
    setPutawayErrors({});
    setPutawayOpen(true);
  }

  async function submitCompletePutaway(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTask) return;
    setPutawayErrors({});
    const parsed = completeSchema.safeParse({ actualLocationId: actualLocationId.trim() });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!err[k]) err[k] = issue.message;
      }
      setPutawayErrors(err);
      return;
    }
    try {
      const res = await completePutawayTask({
        id: activeTask.id,
        purchaseOrderId: id,
        body: { actualLocationId: parsed.data.actualLocationId },
      }).unwrap();
      if (!res.success) { toast.error((res as { message?: string }).message || "Hoàn tất xếp hàng lên kệ thất bại"); return; }
      toast.success((res as { message?: string }).message || "Đã hoàn tất xếp hàng lên kệ");
      setPutawayOpen(false); setActiveTask(null); refetch();
    } catch (err) { toast.error(apiErrMessage(err)); }
  }

  if (!id) return <p className="text-sm text-rose-600">Thiếu mã đơn.</p>;

  const progressPct = progress && progress.totalOrderedQty > 0
    ? Math.min(100, (progress.totalReceivedQty / progress.totalOrderedQty) * 100)
    : 0;

  return (
    <DetailPageLayout>
      {/* ── Header ── */}
      <DetailPageHeader
        backHref="/purchase-orders"
        backLabel="Đơn nhập"
        eyebrow="Chi tiết đơn nhập"
        title={supplierName || "Đơn mua hàng"}
        code={po?.poNumber}
        status={
          po ? (
            <DetailStatusBadge
              status={poStatus}
              statusConfig={PO_STATUS_CONFIG}
              fallback={poStatus}
            />
          ) : null
        }
        description="Theo dõi đặt hàng, nhận hàng GRN, xếp kệ và lịch sử xử lý của đơn nhập."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManagePurchaseOrder && isDraft ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openEditHeaderDialog}
                className="gap-1.5"
              >
                <FileText className="size-4" />
                Sửa thông tin
              </Button>
            ) : null}

            {canReceive && (
              <Button
                onClick={openGrn}
                size="sm"
                className="gap-1.5"
              >
                <PackagePlus className="size-4" />
                Nhập hàng
              </Button>
            )}

            {canManagePurchaseOrder && isDraft && (
              <Button
                onClick={handleApprove}
                disabled={approvingPo || !canApprove}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                title={!canApprove ? "Cần thêm ít nhất một dòng hàng trước khi duyệt đơn nhập." : undefined}
              >
                {approvingPo ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
                Duyệt đơn nhập
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancellingPo}
                className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20"
              >
                {cancellingPo ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                Hủy đơn nhập
              </Button>
            )}

            <PermissionControl allowedRoles={ADMIN_MANAGER_ROLES}>
              {isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deletingPo}
                  className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  {deletingPo ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Xóa đơn nhập
                </Button>
              )}
            </PermissionControl>
          </div>
        }
      >

      {/* ── Loading / Error ── */}
      {detailLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {["supplier", "warehouse", "expected-date", "status"].map((key) => (
              <div key={key} className="rounded-lg border border-border p-4">
                <Skeleton className="h-3 w-16 mb-2 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      ) : detailError || !po || !detail ? (
        <DetailErrorState
          message={
            apiErrStatus(detailLoadError) === 403 || apiErrStatus(detailLoadError) === "403"
              ? "Bạn chưa được phân quyền thao tác kho của đơn nhập này"
              : "Không tải được đơn nhập hàng"
          }
          backHref="/purchase-orders"
          backLabel="Về danh sách"
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* ── Summary Strip ── */}
          <DetailSummaryGrid className="gap-0 overflow-hidden rounded-lg border border-border">
            {/* Status card */}
            <DetailSummaryItem
              label="Trạng thái đơn"
              value={
                <DetailStatusBadge
                  status={poStatus}
                  statusConfig={PO_STATUS_CONFIG}
                  fallback={poStatus}
                />
              }
              helper={po.poNumber}
              icon={<ShoppingCart className="size-4" />}
              mono
              surface={false}
              className="border-b border-r border-border last:border-r-0 sm:last:border-r lg:border-b-0"
            />

            {/* Order Date */}
            <DetailSummaryItem
              label="Ngày đặt hàng"
              value={po.orderDate ?? "—"}
              helper={po.expectedDate ? `Dự kiến: ${po.expectedDate}` : undefined}
              icon={<CalendarDays className="size-4" />}
              surface={false}
              className="border-b border-border lg:border-b-0 lg:border-r"
            />

            {/* Progress */}
            <DetailSummaryItem
              label="Tiến độ nhập"
              value={`${progress?.totalReceivedQty ?? 0} / ${progress?.totalOrderedQty ?? 0}`}
              helper={
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        progressPct >= 100 ? "bg-emerald-500" : progressPct > 0 ? "bg-emerald-400" : "bg-muted-foreground/20"
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{Math.round(progressPct)}% hoàn thành</p>
                </div>
              }
              icon={<Activity className="size-4" />}
              surface={false}
              className="border-b border-r border-border sm:border-b-0"
            />

            {/* Total */}
            <DetailSummaryItem
              label="Tổng tiền đơn"
              value={displayTotal != null ? displayTotal.toLocaleString("vi-VN") : "—"}
              helper={displayTotal != null ? "VNĐ" : undefined}
              icon={<DollarSign className="size-4" />}
              surface={false}
            />
          </DetailSummaryGrid>

          {canEditDraftLines ? (
            <PoLinesSection
              purchaseOrderId={po.id}
              canImportExcel={canEditDraftLines}
              lines={items}
              itemsLoading={detailLoading}
              lineProductId={lineProductId}
              setLineProductId={setLineProductId}
              lineQty={lineQty}
              setLineQty={setLineQty}
              linePrice={linePrice}
              setLinePrice={setLinePrice}
              lineErrors={lineErrors}
              productOptions={productOptions}
              productsErr={productsErr}
              productsLoading={productsLoading}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              selectedProduct={selectedProduct}
              savingLine={savingLine}
              isDeletingLine={deletingLine}
              onAddLine={handleAddLine}
              onDeleteLine={handleDeleteLine}
              productNameMap={productNameMap}
              embedded
            />
          ) : null}

          {/* ── Tabs ── */}
          <Tabs defaultValue="info" className="space-y-0 border-t border-border pt-4">
            <TabsList className="grid h-10 w-full grid-cols-4 gap-1 rounded-lg border border-border bg-muted/40 p-1">
              <TabsTrigger
                value="info"
                className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <FileText className="size-3.5 mr-1.5 inline-block" />
                Thông tin đơn nhập
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <ShoppingCart className="size-3.5 mr-1.5 inline-block" />
                Dòng hàng
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{items.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="receipts"
                className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <ReceiptText className="size-3.5 mr-1.5 inline-block" />
                Phiếu nhập
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{receipts.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="putaway"
                className="h-8 gap-1.5 rounded-md px-3 text-xs font-semibold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <TrendingUp className="size-3.5 mr-1.5 inline-block" />
                Sắp xếp kho
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{tasks.length}</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: PO Info ── */}
            <TabsContent value="info" className="mt-0">
              <div className="overflow-hidden rounded-b-lg border-x border-b border-border">
                <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="px-6 py-3">
                    <InfoRow
                      icon={<FileText className="size-3.5" />}
                      label="Mã đơn nhập hàng"
                      value={<span className="font-mono font-bold text-primary">{po.poNumber}</span>}
                    />
                    <InfoRow
                      icon={<Building2 className="size-3.5" />}
                      label="Nhà cung cấp"
                      value={supplierName}
                    />
                    <InfoRow
                      icon={<Warehouse className="size-3.5" />}
                      label="Kho nhận hàng"
                      value={warehouseName}
                    />
                  </div>
                  <div className="px-6 py-3">
                    <InfoRow
                      icon={<CalendarDays className="size-3.5" />}
                      label="Ngày dự kiến nhận"
                      value={po.expectedDate
                        ? <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{po.expectedDate}</span>
                        : <span className="text-slate-400">Chưa xác định</span>}
                    />
                    <InfoRow
                      icon={<Clock className="size-3.5" />}
                      label="Ngày tạo đơn"
                      value={formatDateTime(po.createdAt)}
                    />
                    <InfoRow
                      icon={<Activity className="size-3.5" />}
                      label="Cập nhật lần cuối"
                      value={formatDateTime(po.updatedAt)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: PO Items ── */}
            <TabsContent value="items" className="mt-0">
              <div className="overflow-hidden rounded-b-lg border-x border-b border-border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="ui-table-header">
                      <TableRow>
                        <TableHead className="ui-label w-12 py-3.5 pl-5 pr-3">#</TableHead>
                        <TableHead className="ui-label px-3 py-3.5">Mã hàng / tên SP</TableHead>
                        <TableHead className="ui-label px-3 py-3.5 text-right">SL đặt</TableHead>
                        <TableHead className="ui-label px-3 py-3.5 text-right">Đã nhận</TableHead>
                        <TableHead className="ui-label px-3 py-3.5 text-right">Còn lại</TableHead>
                        <TableHead className="ui-label px-3 py-3.5 text-right">Đơn giá</TableHead>
                        <TableHead className="ui-label px-3 py-3.5">Tiến độ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <ShoppingCart className="size-8 text-slate-300 dark:text-slate-600" />
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Đơn nhập chưa có dòng hàng.</p>
                                <p className="mt-1 text-xs text-slate-400">Bạn có thể bổ sung sản phẩm trước khi duyệt đơn.</p>
                              </div>
                              {canEditDraftLines ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => document.getElementById("po-line-product")?.focus()}
                                >
                                  <PackagePlus className="mr-1.5 size-4" />
                                  Thêm dòng hàng
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((row, idx) => {
                          const ordered = Number(row.orderedQty ?? 0);
                          const received = Number(row.receivedQty ?? 0);
                          const remain = Math.max(0, ordered - received);
                          const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
                          return (
                            <TableRow
                              key={row.id}
                              className="ui-table-row"
                            >
                              <TableCell className="py-3.5 pl-5 pr-3 text-xs font-bold text-slate-400">{idx + 1}</TableCell>
                              <TableCell className="px-3 py-3.5">
                                <span className="font-mono text-xs font-semibold text-primary block">{row.productSku}</span>
                                {row.productName && <span className="text-xs text-slate-500 dark:text-slate-400">{row.productName}</span>}
                              </TableCell>
                              <TableCell className="px-3 py-3.5 text-right tabular-nums text-sm text-slate-600 dark:text-slate-400">{ordered}</TableCell>
                              <TableCell className="px-3 py-3.5 text-right tabular-nums text-sm text-slate-600 dark:text-slate-400">{received}</TableCell>
                              <TableCell className="px-3 py-3.5 text-right">
                                <span className={cn("text-sm font-bold tabular-nums", remain === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}>
                                  {remain}
                                </span>
                              </TableCell>
                              <TableCell className="px-3 py-3.5 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">
                                {row.unitPrice != null ? `₫${row.unitPrice.toLocaleString("vi-VN")}` : "—"}
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div
                                      className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-primary" : "bg-slate-300")}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-400 tabular-nums">{Math.round(pct)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Inbound Receipts ── */}
            <TabsContent value="receipts" className="mt-0">
              <div className="overflow-hidden rounded-b-lg border-x border-b border-border">
                {receipts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <FileText className="size-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">Chưa có phiếu nhập kho nào cho đơn nhập này.</p>
                    {canReceive && (
                      <Button size="sm" onClick={openGrn} className="gap-1.5">
                        <PackagePlus className="size-4" />
                        Tạo phiếu nhập
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="ui-table-header">
                        <TableRow>
                          <TableHead className="ui-label py-3.5 pl-5 pr-3">Mã phiếu GRN</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Ngày nhập</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Trạng thái</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Ghi chú</TableHead>
                          <TableHead className="ui-label px-3 py-3.5 pr-5 text-right">Ngày tạo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((r) => (
                          <TableRow key={r.id} className="ui-table-row">
                            <TableCell className="py-3.5 pl-5 pr-3">
                              <span className="font-mono text-xs font-semibold text-primary">{r.receiptNumber}</span>
                            </TableCell>
                            <TableCell className="px-3 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.receivedDate ?? "—"}</TableCell>
                            <TableCell className="px-3 py-3.5">
                              <StatusPill map={GRN_STATUS} value={r.status} />
                            </TableCell>
                            <TableCell className="max-w-48 truncate px-3 py-3.5 text-sm text-slate-600 dark:text-slate-400">{r.note ?? "—"}</TableCell>
                            <TableCell className="px-3 py-3.5 pr-5 text-right text-xs text-slate-500">
                              {formatDateTime(r.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 4: Putaway Tasks ── */}
            <TabsContent value="putaway" className="mt-0">
              <div className="overflow-hidden rounded-b-lg border-x border-b border-border">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-14 text-center">
                    <MapPin className="size-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">Chưa có tác vụ sắp xếp kho nào.</p>
                    <p className="text-xs text-slate-400">Tạo phiếu nhập hàng để hệ thống tự động sinh nhiệm vụ xếp hàng lên kệ.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="ui-table-header">
                        <TableRow>
                          <TableHead className="ui-label py-3.5 pl-5 pr-3">Mã nhiệm vụ</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Trạng thái</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Vị trí gợi ý</TableHead>
                          <TableHead className="ui-label px-3 py-3.5">Vị trí thực tế</TableHead>
                          <TableHead className="ui-label py-3.5 pl-3 pr-5 text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => {
                          const canComplete = task.status === "PENDING" || task.status === "IN_PROGRESS";
                          const getSuggested = locationOptions.find((l) => l.id === task.suggestedLocationId);
                          const getActual = locationOptions.find((l) => l.id === task.actualLocationId);
                          return (
                            <TableRow
                              key={task.id}
                              className={cn(
                                "ui-table-row",
                                task.status === "COMPLETED" ? "opacity-60" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30",
                              )}
                            >
                              <TableCell className="py-3.5 pl-5 pr-3">
                                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  PUT-{task.id.slice(0, 8).toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                <StatusPill map={PUTAWAY_STATUS} value={task.status} />
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                {task.suggestedLocationId ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                    <MapPin className="size-3 text-slate-400" />
                                    {getSuggested?.code ?? task.suggestedLocationId.slice(0, 8)}
                                  </span>
                                ) : <span className="text-slate-400 text-xs">,</span>}
                              </TableCell>
                              <TableCell className="px-3 py-3.5">
                                {task.actualLocationId ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3" />
                                    {getActual?.code ?? task.actualLocationId.slice(0, 8)}
                                  </span>
                                ) : <span className="text-slate-400 text-xs">,</span>}
                              </TableCell>
                              <TableCell className="py-3.5 pl-3 pr-5 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  className={cn(
                                    "h-8 rounded-lg gap-1 px-2.5 text-xs",
                                    !canComplete && "opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-700",
                                  )}
                                  onClick={() => canComplete && openPutaway(task)}
                                  disabled={!canComplete}
                                >
                                  <PackageCheck className="size-3.5" />
                                  Hoàn tất
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
      </DetailPageHeader>

      {/* ── Edit Draft Header Dialog ── */}
      <Dialog open={editHeaderOpen} onOpenChange={setEditHeaderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleUpdateHeader}>
            <DialogHeader>
              <DialogTitle>Sửa thông tin đơn nhập nháp</DialogTitle>
              <DialogDescription>
                Chỉ đơn nhập ở trạng thái Nháp mới được sửa nhà cung cấp, kho nhận, ngày và tổng tiền.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="ui-label">Nhà cung cấp</label>
                <SearchableSelect
                  value={editSupplierId}
                  onValueChange={setEditSupplierId}
                  options={supplierOptions}
                  placeholder="Chọn nhà cung cấp"
                  searchPlaceholder="Tìm nhà cung cấp..."
                  emptyText="Không tìm thấy nhà cung cấp"
                  dialogTitle="Chọn nhà cung cấp"
                  error={Boolean(editHeaderErrors.supplierId)}
                />
                {editHeaderErrors.supplierId ? (
                  <p className="text-xs text-rose-600">{editHeaderErrors.supplierId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="ui-label">Kho nhận</label>
                <Select value={editWarehouseId} onValueChange={(value) => setEditWarehouseId(value ?? "")}>
                  <SelectTrigger className={cn(editHeaderErrors.warehouseId && "border-rose-400")}>
                    <span className="truncate text-sm">
                      {editWarehouseId
                        ? warehouses.find((warehouse) => warehouse.id === editWarehouseId)?.name ?? editWarehouseId
                        : "Chọn kho nhận"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editHeaderErrors.warehouseId ? (
                  <p className="text-xs text-rose-600">{editHeaderErrors.warehouseId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="ui-label">Ngày đặt hàng</label>
                <Input
                  type="date"
                  value={editOrderDate}
                  onChange={(event) => setEditOrderDate(event.target.value)}
                  className={cn(editHeaderErrors.orderDate && "border-rose-400")}
                />
                {editHeaderErrors.orderDate ? (
                  <p className="text-xs text-rose-600">{editHeaderErrors.orderDate}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="ui-label">Ngày dự kiến nhận</label>
                <Input
                  type="date"
                  value={editExpectedDate}
                  onChange={(event) => setEditExpectedDate(event.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="ui-label">Tổng tiền ước tính</label>
                <Input
                  value={editTotalAmountStr}
                  onChange={(event) => setEditTotalAmountStr(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className={cn("max-w-xs", editHeaderErrors.totalAmountStr && "border-rose-400")}
                />
                {editHeaderErrors.totalAmountStr ? (
                  <p className="text-xs text-rose-600">{editHeaderErrors.totalAmountStr}</p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditHeaderOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updatingPo}>
                {updatingPo ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── GRN Dialog ── */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="!flex max-h-[92vh] !w-[calc(100vw-48px)] !max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl p-0 xl:!max-w-[1280px]">
          <form onSubmit={handleSubmitGrn} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="size-5 text-indigo-600" />
                Tạo phiếu nhập kho (GRN)
              </DialogTitle>
              <DialogDescription>
                Nhập số lượng thực nhận cho từng dòng hàng. Dòng nào bỏ trống hoặc = 0 sẽ bị bỏ qua.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              {/* Lines table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="py-3 pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã hàng</TableHead>
                      <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đặt</TableHead>
                      <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Đã nhận</TableHead>
                      <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Còn lại</TableHead>
                      <TableHead className="p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400 text-indigo-600 dark:text-indigo-400">Nhập lần này ★</TableHead>
                      <TableHead className="min-w-56 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-indigo-600 dark:text-indigo-400">Vị trí nhập ★</TableHead>
                      <TableHead className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grnLines.map((line) => {
                      const item = items.find((i) => i.id === line.poItemId);
                      if (!item) return null;
                      const ordered = Number(item.orderedQty ?? 0);
                      const received = Number(item.receivedQty ?? 0);
                      const remain = Math.max(0, ordered - received);
                      const entered = Number(line.receivedQty.replace(",", "."));
                      const isOver = entered > 0 && !Number.isNaN(entered) && entered > remain;
                      return (
                        <TableRow key={line.poItemId} className={cn("border-b border-slate-50 last:border-0 dark:border-slate-800/60", isOver && "bg-rose-50/30 dark:bg-rose-950/10")}>
                          <TableCell className="py-3 pl-4">
                            <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-400">{item.productSku}</span>
                          </TableCell>
                          <TableCell className="p-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{ordered}</TableCell>
                          <TableCell className="p-3 text-right text-sm tabular-nums text-slate-600 dark:text-slate-400">{received}</TableCell>
                          <TableCell className="p-3 text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">{remain}</TableCell>
                          <TableCell className="p-3 text-right">
                            <Input
                              value={line.receivedQty}
                              onChange={(e) => updateGrnLine(line.poItemId, "receivedQty", e.target.value)}
                              inputMode="decimal"
                              placeholder={`≤ ${remain}`}
                              className={cn("w-24 text-right h-8 rounded-lg text-sm font-semibold", isOver && "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-950/20")}
                            />
                          </TableCell>
                          <TableCell className="p-3">
                            <SearchableSelect
                              options={grnLocationOptions(line.poItemId)}
                              value={line.locationId}
                              onValueChange={(locationId) => updateGrnLine(line.poItemId, "locationId", locationId)}
                              onOpenChange={(open) => {
                              if (open) void loadGrnLineLocations(line.poItemId);
                              }}
                              placeholder="Chọn vị trí nhập..."
                              searchPlaceholder="Tìm mã vị trí..."
                              emptyText="Không có vị trí phù hợp trong kho của đơn nhập này"
                              dialogTitle={`Chọn vị trí nhập cho ${item.productSku}`}
                              loading={Boolean(grnLocationLoading[line.poItemId])}
                              disabled={!selectedWhId}
                              className={cn(
                                "h-8 rounded-lg text-xs",
                                entered > 0 && !line.locationId && "border-rose-400 ring-1 ring-rose-200",
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-3">
                            <Input
                              value={line.note}
                              onChange={(e) => updateGrnLine(line.poItemId, "note", e.target.value)}
                              placeholder="Ghi chú…"
                              className="w-32 h-8 rounded-lg text-xs"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Note */}
              <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Ghi chú phiếu nhập <span className="text-slate-400 font-normal text-xs">(tuỳ chọn)</span>
                  </label>
                  <Textarea
                    value={grnNote}
                    onChange={(e) => setGrnNote(e.target.value)}
                    placeholder="Ghi chú chung về lô hàng…"
                    rows={2}
                    className="rounded-xl text-sm resize-none"
                  />
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-slate-200 bg-white px-6 pb-8 pt-5 gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setGrnOpen(false)} className="rounded-xl">Hủy</Button>
              <Button type="submit" size="sm" disabled={creatingGrn} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                {creatingGrn ? <Loader2 className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
                Tạo phiếu nhập
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Putaway Dialog ── */}
      <Dialog open={putawayOpen} onOpenChange={setPutawayOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={submitCompletePutaway}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="size-5 text-indigo-600" />
                Hoàn tất xếp hàng lên kệ
              </DialogTitle>
              {activeTask && (
                <DialogDescription>
                  Nhiệm vụ <span className="font-mono font-semibold">PUT-{activeTask.id.slice(0, 8).toUpperCase()}</span> - xác nhận vị trí đặt hàng thực tế
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="py-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Vị trí thực tế <span className="text-rose-500">*</span>
              </label>
              <Select
                value={actualLocationId || "__empty__"}
                onValueChange={(v) => setActualLocationId(!v || v === "__empty__" ? "" : v)}
              >
                <SelectTrigger className={cn("rounded-xl h-10", putawayErrors.actualLocationId && "border-rose-400")}>
                  <span className="truncate text-sm">
                    {actualLocationId
                      ? (locationOptions.find((l) => l.id === actualLocationId)?.code ??
                        actualLocationId)
                      : "Chọn vị trí thực tế…"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__empty__" className="rounded-lg text-slate-400">Chọn vị trí…</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="rounded-lg">
                      {loc.code ?? loc.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {putawayErrors.actualLocationId && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{putawayErrors.actualLocationId}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">Chọn vị trí kệ mà sản phẩm đã được đặt vào thực tế.</p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPutawayOpen(false)} className="rounded-xl">Hủy</Button>
              <Button type="submit" size="sm" disabled={completingPutaway} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                {completingPutaway ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Xác nhận hoàn tất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  );
}
