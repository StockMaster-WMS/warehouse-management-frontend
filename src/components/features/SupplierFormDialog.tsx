"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { apiErrMessage } from "@/types/api";
import type {
  Supplier,
  CreateSupplierRequest,
} from "@/types/supplier";
import { SUPPLIER_STATUS_LABEL } from "@/types/supplier";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "@/store/services/supplier.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
};

const EMPTY: CreateSupplierRequest = {
  code: "",
  name: "",
  taxCode: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  paymentTerms: 30,
  leadTimeDays: 7,
  status: "active",
};

export function SupplierFormDialog({ open, onOpenChange, supplier }: Props) {
  const isEdit = !!supplier;
  const [form, setForm] = useState<CreateSupplierRequest>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const saving = creating || updating;

  const [prevSupplier, setPrevSupplier] = useState<Supplier | null | undefined>(
    undefined
  );
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen || supplier !== prevSupplier) {
    setPrevOpen(open);
    setPrevSupplier(supplier);
    if (open) {
      setForm(
        supplier
          ? {
            code: supplier.code,
            name: supplier.name,
            taxCode: supplier.taxCode ?? "",
            contactName: supplier.contactName ?? "",
            contactPhone: supplier.contactPhone ?? "",
            contactEmail: supplier.contactEmail ?? "",
            address: supplier.address ?? "",
            paymentTerms: supplier.paymentTerms ?? 30,
            leadTimeDays: supplier.leadTimeDays ?? 7,
            status: supplier.status,
          }
          : EMPTY
      );
      setErrors({});
    }
  }

  function set(field: keyof CreateSupplierRequest, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const copy = { ...p };
      delete copy[field];
      return copy;
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Mã nhà cung cấp là bắt buộc";
    else if (form.code.trim().length > 20) e.code = "Tối đa 20 ký tự";
    if (!form.name.trim()) e.name = "Tên nhà cung cấp là bắt buộc";
    else if (form.name.trim().length > 200) e.name = "Tối đa 200 ký tự";
    if (form.taxCode && form.taxCode.length > 20) e.taxCode = "Tối đa 20 ký tự";
    if (
      form.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
    )
      e.contactEmail = "Email không đúng định dạng";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const payload: CreateSupplierRequest = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      taxCode: form.taxCode?.trim() || undefined,
      contactName: form.contactName?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactEmail: form.contactEmail?.trim() || undefined,
      address: form.address?.trim() || undefined,
    };

    try {
      if (isEdit) {
        const res = await updateSupplier({
          id: supplier!.id,
          body: payload,
        }).unwrap();
        if (!res.success) {
          toast.error(res.message || "Cập nhật thất bại");
          return;
        }
        toast.success("Đã cập nhật nhà cung cấp");
      } else {
        const res = await createSupplier(payload).unwrap();
        if (!res.success) {
          toast.error(res.message || "Thêm thất bại");
          return;
        }
        toast.success("Đã thêm nhà cung cấp mới");
      }
      onOpenChange(false);
    } catch (err) {
      const msg = apiErrMessage(err);
      if (
        msg.includes("Mã nhà cung cấp đã tồn tại") ||
        msg.toLowerCase().includes("code")
      ) {
        setErrors((p) => ({ ...p, code: msg }));
      } else if (
        msg.includes("Mã số thuế đã tồn tại") ||
        msg.toLowerCase().includes("tax")
      ) {
        setErrors((p) => ({ ...p, taxCode: msg }));
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Code + Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Mã nhà cung cấp <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="VD: NCC-001"
                maxLength={20}
                className="font-mono"
              />
              {errors.code && (
                <p className="text-xs text-rose-500">{errors.code}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Tên nhà cung cấp <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Công ty TNHH ABC"
                maxLength={200}
              />
              {errors.name && (
                <p className="text-xs text-rose-500">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Row 2: TaxCode + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Mã số thuế
              </Label>
              <Input
                value={form.taxCode ?? ""}
                onChange={(e) => set("taxCode", e.target.value)}
                placeholder="VD: 0312345678"
                maxLength={20}
                className="font-mono"
              />
              {errors.taxCode && (
                <p className="text-xs text-rose-500">{errors.taxCode}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Trạng thái
              </Label>
              <Select
                value={form.status ?? "active"}
                onValueChange={(v) => v && set("status", v)}
              >
                <SelectTrigger>
                  <span className="flex flex-1 truncate text-left">
                    {SUPPLIER_STATUS_LABEL[form.status ?? "active"] ??
                      "Đang hoạt động"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  <SelectItem value="suspended">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Contact */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Người liên hệ
              </Label>
              <Input
                value={form.contactName ?? ""}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Số điện thoại
              </Label>
              <Input
                value={form.contactPhone ?? ""}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="VD: 0901234567"
                maxLength={20}
              />
            </div>
          </div>

          {/* Row 4: Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-500">
              Email
            </Label>
            <Input
              value={form.contactEmail ?? ""}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="VD: email@company.com"
              maxLength={100}
              type="email"
            />
            {errors.contactEmail && (
              <p className="text-xs text-rose-500">{errors.contactEmail}</p>
            )}
          </div>

          {/* Row 5: Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-slate-500">
              Địa chỉ
            </Label>
            <Textarea
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="VD: 123 Nguyễn Trãi, Quận 1, TP.HCM"
              rows={2}
            />
          </div>

          {/* Row 6: Payment + Lead time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Thời hạn thanh toán (ngày)
              </Label>
              <Input
                type="number"
                min={0}
                value={form.paymentTerms ?? 30}
                onChange={(e) =>
                  set("paymentTerms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-500">
                Thời gian giao hàng (ngày)
              </Label>
              <Input
                type="number"
                min={0}
                value={form.leadTimeDays ?? 7}
                onChange={(e) =>
                  set("leadTimeDays", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
