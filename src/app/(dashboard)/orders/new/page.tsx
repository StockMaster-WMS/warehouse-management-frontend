"use client";

import {
  ArrowLeft,
  Loader2,
  Save,
  MapPin,
  User,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AddressForm, AddressValue } from "@/components/features/AddressForm";
import { apiErrMessage } from "@/types/api";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import { useCreateSalesOrderMutation } from "@/store/services/order.service";

function NewOrderFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseIdFromUrl = searchParams.get("warehouseId")?.trim() ?? "";
  const appliedWarehouseFromUrl = useRef(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>({
    street: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
  });
  const [country, setCountry] = useState("VN");
  const [warehouseId, setWarehouseId] = useState("");
  const [priority, setPriority] = useState("5");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: warehousesRes, isFetching: warehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "name",
    sortDir: "asc",
  });
  const [createSalesOrder, { isLoading: creating }] = useCreateSalesOrderMutation();

  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

  useEffect(() => {
    if (appliedWarehouseFromUrl.current || !warehouseIdFromUrl || warehousesLoading) return;
    const exists = warehouses.some((w) => String(w.id) === warehouseIdFromUrl);
    if (exists) {
      setWarehouseId(warehouseIdFromUrl);
      appliedWarehouseFromUrl.current = true;
    }
  }, [warehouseIdFromUrl, warehousesLoading, warehouses]);

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        value: String(w.id),
        label: String(w.name ?? w.id),
      })),
    [warehouses]
  );

  function validate() {
    const next: Record<string, string> = {};
    if (!customerName.trim()) next.customerName = "Nhập hoặc chọn khách hàng";
    if (!address.street.trim()) next.line1 = "Nhập địa chỉ giao hàng";
    if (!address.wardCode.trim()) next.ward = "Chọn phường/xã";
    if (!address.provinceCode.trim()) next.city = "Chọn tỉnh/thành";
    if (!country.trim()) next.country = "Nhập mã quốc gia";
    if (!warehouseId) next.warehouseId = "Chọn kho xuất";
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1) next.priority = "Độ ưu tiên phải là số nguyên >= 1";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin đơn xuất");
      return;
    }
    try {
      const res = await createSalesOrder({
        customerName: customerName.trim(),
        shippingAddress: {
          line1: address.street.trim(),
          ward: address.wardName,
          district: address.districtName, 
          city: address.provinceName,
          country: country.trim().toUpperCase(),
        },
        warehouseId,
        priority: Number(priority),
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Tạo đơn xuất thất bại");
        return;
      }
      toast.success(res.message || "Đã tạo đơn xuất thành công");
      router.push(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo đơn xuất"));
    }
  }

  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Tạo đơn hàng xuất kho"
        description={
          warehouseIdFromUrl
            ? "Khởi tạo đơn xuất kho mới. Kho xuất có thể đã được gợi ý từ liên kết (?warehouseId=)."
            : "Khởi tạo đơn xuất kho mới và chuẩn bị luồng giao nhận."
        }
        actions={
          <Button
            render={<Link href="/orders" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <User className="h-4 w-4 text-indigo-600" />
              <div className="flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Thông tin người nhận
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Nhập địa chỉ giao hàng đầy đủ để tạo đơn xuất.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Khách hàng / Đối tác <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setErrors((prev) => ({ ...prev, customerName: "" }));
                    }}
                    aria-invalid={Boolean(errors.customerName)}
                    placeholder="Nhập tên khách hàng/đối tác..."
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                  {errors.customerName ? (
                    <p className="text-xs font-medium text-rose-600">{errors.customerName}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">SĐT người nhận (nội bộ)</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Tự động điền hoặc nhập mới..."
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                  <p className="text-[11px] text-slate-400">
                    Thông tin này hiện chưa gửi lên hệ thống, dùng cho vận hành nội bộ.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Địa chỉ giao hàng <span className="text-rose-500">*</span>
                </label>
                <AddressForm
                  value={address}
                  onChange={setAddress}
                  required
                />
                {errors.line1 ? <p className="text-xs font-medium text-rose-600">{errors.line1}</p> : null}
                {errors.ward ? <p className="text-xs font-medium text-rose-600">{errors.ward}</p> : null}
                {errors.district ? <p className="text-xs font-medium text-rose-600">{errors.district}</p> : null}
                {errors.city ? <p className="text-xs font-medium text-rose-600">{errors.city}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Warehouse className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Cấu hình đơn xuất
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Kho xuất <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  value={warehouseId}
                  onValueChange={setWarehouseId}
                  options={warehouseOptions}
                  dialogTitle="Chọn kho xuất"
                  placeholder={warehousesLoading ? "Đang tải kho..." : "Chọn hoặc gõ để tìm..."}
                  searchPlaceholder="Tìm theo tên kho…"
                  emptyText="Không tìm thấy kho phù hợp"
                  disabled={warehousesLoading}
                  loading={warehousesLoading}
                  error={Boolean(errors.warehouseId)}
                  className="focus:ring-indigo-500/30"
                />
                {errors.warehouseId ? <p className="text-xs font-medium text-rose-600">{errors.warehouseId}</p> : null}
                {warehouseIdFromUrl && warehouseId === warehouseIdFromUrl ? (
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Kho xuất đang theo liên kết <span className="font-mono">?warehouseId=</span> — có thể đổi tay nếu cần.
                  </p>
                ) : warehouseIdFromUrl && !warehousesLoading && !warehouses.some((w) => String(w.id) === warehouseIdFromUrl) ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Tham số warehouseId trên URL không khớp kho nào — chọn kho thủ công.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Độ ưu tiên <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="5"
                    aria-invalid={Boolean(errors.priority)}
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                  {errors.priority ? <p className="text-xs font-medium text-rose-600">{errors.priority}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Trạng thái</label>
                  <Input value="PENDING" disabled className="border-slate-200 bg-slate-100 font-mono text-sm" />
                  <p className="text-[11px] text-slate-400">Đơn mới tạo luôn bắt đầu ở trạng thái PENDING.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Quốc gia <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="VN"
                  maxLength={2}
                  aria-invalid={Boolean(errors.country)}
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
                {errors.country ? <p className="text-xs font-medium text-rose-600">{errors.country}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={creating}
                className="h-12 w-full bg-indigo-600 shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-70 dark:shadow-none"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {creating ? "Đang tạo..." : "Xác nhận & Xuất kho"}
              </Button>
              <Button
                type="button"
                render={<Link href="/orders" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-slate-200 bg-white"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center pb-20 text-sm text-slate-500">Đang tải form…</div>
      }
    >
      <NewOrderFormContent />
    </Suspense>
  );
}
