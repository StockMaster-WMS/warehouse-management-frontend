"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Building2,
  Info,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Loader2,
  Hash,
  Clock,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCreateSupplierMutation } from "@/store/services/supplier.service";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { apiErrMessage } from "@/types/api";
import type { CreateSupplierRequest, SupplierStatus } from "@/types/supplier";
import { supplierStatusLabel } from "@/types/supplier";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-600">{msg}</p>;
}

export default function NewSupplierPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [status, setStatus] = useState<SupplierStatus>("active");

  const isDirty =
    code.trim().length > 0 ||
    name.trim().length > 0 ||
    taxCode.trim().length > 0 ||
    contactName.trim().length > 0 ||
    contactPhone.trim().length > 0 ||
    contactEmail.trim().length > 0 ||
    address.trim().length > 0;
  const { confirmLeave } = useUnsavedChanges(isDirty);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createSupplier, { isLoading }] = useCreateSupplierMutation();

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

    const body: CreateSupplierRequest = {
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
      const res = await createSupplier(body).unwrap();
      if (!res.success) {
        const msg = res.message || "";
        if (msg.includes("Mã nhà cung cấp đã tồn tại")) {
          setErrors((prev) => ({ ...prev, code: msg }));
        } else if (msg.includes("Mã số thuế đã tồn tại")) {
          setErrors((prev) => ({ ...prev, taxCode: msg }));
        } else {
          toast.error(msg || "Tạo nhà cung cấp thất bại");
        }
        return;
      }
      toast.success(res.message || "Đã tạo nhà cung cấp thành công");
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

  return (
    <div className="w-full space-y-4 pb-20 sm:space-y-6">
      <PageHeader
        title="Thêm nhà cung cấp"
        description="Khởi tạo hồ sơ đối tác cung ứng và thông tin liên hệ."
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
            onClick={() => {
              if (confirmLeave()) router.push("/suppliers");
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ── Left: main fields ── */}
          <div className="space-y-6 md:col-span-2">
            {/* Business info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Thông tin doanh nghiệp
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Mã nhà cung cấp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="VD: NCC-001"
                        maxLength={20}
                        className="pl-10 font-mono"
                      />
                    </div>
                    <FieldError msg={errors.code} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Tên nhà cung cấp <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Công ty TNHH ABC"
                      maxLength={200}
                    />
                    <FieldError msg={errors.name} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Mã số thuế
                  </label>
                  <Input
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="VD: 0312345678"
                    maxLength={20}
                    className="font-mono"
                  />
                  <FieldError msg={errors.taxCode} />
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Info className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Thông tin liên hệ
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Người liên hệ
                    </label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Họ tên người liên hệ"
                        className="pl-10"
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      SĐT liên hệ
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0901234567"
                        className="pl-10"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@company.com"
                      className="pl-10"
                      maxLength={100}
                    />
                  </div>
                  <FieldError msg={errors.contactEmail} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Nguyễn Trãi, Quận 1, TP.HCM"
                      className="min-h-20 pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Trạng thái
                </h3>
              </div>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as SupplierStatus)}
              >
                <SelectTrigger className="font-medium">
                  <span className="flex flex-1 truncate text-left">
                    {supplierStatusLabel(status)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  <SelectItem value="suspended">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment & Lead time */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Điều khoản
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Thời hạn thanh toán (ngày)
                  </label>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min={0}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Thời gian giao hàng (ngày)
                  </label>
                  <div className="relative">
                    <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      min={0}
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Lưu hồ sơ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-200 bg-white"
                  onClick={() => {
                    if (confirmLeave()) router.push("/suppliers");
                  }}
                >
                  Hủy bỏ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
