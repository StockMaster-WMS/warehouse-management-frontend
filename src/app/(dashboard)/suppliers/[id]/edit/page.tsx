"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetSupplierByIdQuery,
  useUpdateSupplierMutation,
} from "@/store/services/supplier.service";
import { apiErrMessage } from "@/types/api";
import type { SupplierStatus, UpdateSupplierRequest } from "@/types/supplier";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-600">{msg}</p>;
}

export default function EditSupplierPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();

  const {
    data: supplierRes,
    isLoading: loadingSupplier,
    isError,
    error,
  } = useGetSupplierByIdQuery(id);
  const supplier = supplierRes?.data;

  const initial = useMemo(() => {
    if (!supplier) return null;
    return {
      code: supplier.code ?? "",
      name: supplier.name ?? "",
      taxCode: supplier.taxCode ?? "",
      contactName: supplier.contactName ?? "",
      contactPhone: supplier.contactPhone ?? "",
      contactEmail: supplier.contactEmail ?? "",
      address: supplier.address ?? "",
      paymentTerms: String(supplier.paymentTerms ?? 30),
      leadTimeDays: String(supplier.leadTimeDays ?? 7),
      status: (supplier.status ?? "ACTIVE") as SupplierStatus,
    };
  }, [supplier]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [status, setStatus] = useState<SupplierStatus>("ACTIVE");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updateSupplier, { isLoading: saving }] = useUpdateSupplierMutation();

  const [synced, setSynced] = useState(false);
  if (initial && !synced) {
    setCode(initial.code);
    setName(initial.name);
    setTaxCode(initial.taxCode);
    setContactName(initial.contactName);
    setContactPhone(initial.contactPhone);
    setContactEmail(initial.contactEmail);
    setAddress(initial.address);
    setPaymentTerms(initial.paymentTerms);
    setLeadTimeDays(initial.leadTimeDays);
    setStatus(initial.status);
    setSynced(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Mã nhà cung cấp là bắt buộc";
    else if (code.trim().length > 20) errs.code = "Tối đa 20 ký tự";
    if (!name.trim()) errs.name = "Tên nhà cung cấp là bắt buộc";
    else if (name.trim().length > 200) errs.name = "Tối đa 200 ký tự";
    if (taxCode.trim() && taxCode.trim().length > 20)
      errs.taxCode = "Tối đa 20 ký tự";
    if (
      contactEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
    )
      errs.contactEmail = "Email không hợp lệ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body: UpdateSupplierRequest = {
      code: code.trim(),
      name: name.trim(),
      status,
      ...(taxCode.trim() ? { taxCode: taxCode.trim() } : {}),
      ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
      ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
      ...(contactEmail.trim() ? { contactEmail: contactEmail.trim() } : {}),
      ...(address.trim() ? { address: address.trim() } : {}),
      paymentTerms: Number(paymentTerms) || 30,
      leadTimeDays: Number(leadTimeDays) || 7,
    };

    try {
      const res = await updateSupplier({ id, body }).unwrap();
      if (!res.success) {
        const msg = res.message || "";
        if (msg.includes("Mã nhà cung cấp đã tồn tại")) {
          setErrors((prev) => ({ ...prev, code: msg }));
        } else if (msg.includes("Mã số thuế đã tồn tại")) {
          setErrors((prev) => ({ ...prev, taxCode: msg }));
        } else {
          toast.error(msg || "Cập nhật thất bại");
        }
        return;
      }
      toast.success(res.message || "Đã cập nhật nhà cung cấp");
      router.push("/suppliers");
    } catch (err) {
      const msg = apiErrMessage(err);
      if (msg.includes("Mã nhà cung cấp đã tồn tại")) {
        setErrors((prev) => ({ ...prev, code: msg }));
      } else if (msg.includes("Mã số thuế đã tồn tại")) {
        setErrors((prev) => ({ ...prev, taxCode: msg }));
      } else {
        toast.error(msg);
      }
    }
  }

  if (loadingSupplier) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chỉnh sửa nhà cung cấp"
          description="Đang tải dữ liệu…"
          actions={
            <Button
              render={<Link href="/suppliers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chỉnh sửa nhà cung cấp"
          description="Không tìm thấy nhà cung cấp"
          actions={
            <Button
              render={<Link href="/suppliers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm">
            {apiErrMessage(error, "Không tìm thấy nhà cung cấp.")}
          </p>
          <Button
            render={<Link href="/suppliers" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Về danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20 sm:space-y-6">
      <PageHeader
        title="Chỉnh sửa nhà cung cấp"
        description={`${supplier.name} (${supplier.code})`}
        actions={
          <Button
            render={<Link href="/suppliers" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hồ sơ pháp nhân
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Tên công ty / Đơn vị <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                  <FieldError msg={errors.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Mã số thuế / GPKD
                  </label>
                  <Input
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    maxLength={20}
                    className="font-mono"
                  />
                  <FieldError msg={errors.taxCode} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Địa chỉ trụ sở chính
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 min-h-20 py-3 text-sm border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Phone className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Đầu mối liên hệ
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Email công việc
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="pl-10 border-slate-200 bg-slate-50/50"
                  />
                  <FieldError msg={errors.contactEmail} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="pl-10 border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Cấu hình hợp tác
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Trạng thái hồ sơ
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v as SupplierStatus)}>
                  <SelectTrigger className="border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Chọn trạng thái..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Đang hợp tác</SelectItem>
                    <SelectItem value="PENDING">Chờ phê duyệt</SelectItem>
                    <SelectItem value="INACTIVE">Ngưng cung ứng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-4">
              <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Cập nhật thay đổi
              </Button>
              <Button
                render={<Link href="/suppliers" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-slate-200 bg-white"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
