"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AddressForm, type AddressValue } from "@/components/features/AddressForm";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { apiErrMessage } from "@/types/api";
import {
  type CreateCustomerRequest,
  type Customer,
  type CustomerAddress,
} from "@/types/customer";

type CustomerFormValues = {
  code: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  taxCode: string;
  address: AddressValue;
  notes: string;
  isActive: boolean;
};

type CustomerFormProps = {
  customer?: Customer;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (body: CreateCustomerRequest) => Promise<void>;
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-600">{msg}</p>;
}

function getAddressText(
  address: CustomerAddress | string | null | undefined,
  keys: string[],
) {
  if (!address) return "";
  if (typeof address === "string") return address.trim();

  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }

  return "";
}

function toAddressValue(address: CustomerAddress | string | null | undefined): AddressValue {
  return {
    street: getAddressText(address, ["line1", "street", "address"]),
    provinceCode: getAddressText(address, ["provinceCode", "cityCode"]),
    provinceName: getAddressText(address, ["provinceName", "city", "province"]),
    districtCode: getAddressText(address, ["districtCode"]),
    districtName: getAddressText(address, ["districtName", "district"]),
    wardCode: getAddressText(address, ["wardCode"]),
    wardName: getAddressText(address, ["wardName", "ward"]),
  };
}

function toCustomerAddress(address: AddressValue): CustomerAddress | undefined {
  const street = address.street.trim();
  const provinceCode = address.provinceCode.trim();
  const provinceName = address.provinceName.trim();
  const districtCode = address.districtCode.trim();
  const districtName = address.districtName.trim();
  const wardCode = address.wardCode.trim();
  const wardName = address.wardName.trim();

  if (!street && !provinceCode && !provinceName && !districtCode && !districtName && !wardCode && !wardName) {
    return undefined;
  }

  return {
    ...(street ? { line1: street, street } : {}),
    ...(provinceCode ? { provinceCode } : {}),
    ...(provinceName ? { provinceName, city: provinceName } : {}),
    ...(districtCode ? { districtCode } : {}),
    ...(districtName ? { districtName, district: districtName } : {}),
    ...(wardCode ? { wardCode } : {}),
    ...(wardName ? { wardName, ward: wardName } : {}),
    country: "VN",
  };
}

function buildInitialValues(customer?: Customer): CustomerFormValues {
  return {
    code: customer?.code ?? "",
    name: customer?.name ?? "",
    contactName: customer?.contactName ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    taxCode: customer?.taxCode ?? "",
    address: toAddressValue(customer?.address),
    notes: customer?.notes ?? "",
    isActive: customer?.isActive ?? true,
  };
}

function toRequestBody(values: CustomerFormValues): CreateCustomerRequest {
  const address = toCustomerAddress(values.address);

  return {
    code: values.code.trim(),
    name: values.name.trim(),
    isActive: values.isActive,
    ...(values.contactName.trim() ? { contactName: values.contactName.trim() } : {}),
    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
    ...(values.taxCode.trim() ? { taxCode: values.taxCode.trim() } : {}),
    ...(address ? { address } : {}),
    ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
  };
}

function mapSubmitErrorToField(message: string): Record<string, string> | null {
  if (message.includes("Mã khách hàng")) return { code: message };
  if (message.includes("Tên khách hàng")) return { name: message };
  if (message.includes("Tên người liên hệ")) return { contactName: message };
  if (message.includes("Số điện thoại")) return { phone: message };
  if (message.includes("Email")) return { email: message };
  if (message.includes("Mã số thuế")) return { taxCode: message };
  if (message.includes("Ghi chú")) return { notes: message };
  return null;
}

export function CustomerForm({
  customer,
  submitLabel,
  isSubmitting,
  onSubmit,
}: CustomerFormProps) {
  const router = useRouter();
  const initial = useMemo(() => buildInitialValues(customer), [customer]);
  const [values, setValues] = useState<CustomerFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.keys(initial).some((key) => {
    const field = key as keyof CustomerFormValues;
    if (field === "address") {
      return JSON.stringify(values.address) !== JSON.stringify(initial.address);
    }
    return values[field] !== initial[field];
  });
  const { confirmLeave } = useUnsavedChanges(isDirty);

  const updateField = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!values.code.trim()) nextErrors.code = "Mã khách hàng là bắt buộc";
    else if (values.code.trim().length > 30) nextErrors.code = "Tối đa 30 ký tự";

    if (!values.name.trim()) nextErrors.name = "Tên khách hàng là bắt buộc";
    else if (values.name.trim().length > 200) nextErrors.name = "Tối đa 200 ký tự";

    if (values.contactName.trim().length > 120) {
      nextErrors.contactName = "Tối đa 120 ký tự";
    }

    if (values.phone.trim().length > 20) {
      nextErrors.phone = "Tối đa 20 ký tự";
    }

    if (values.email.trim().length > 120) {
      nextErrors.email = "Tối đa 120 ký tự";
    } else if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (values.taxCode.trim().length > 50) {
      nextErrors.taxCode = "Tối đa 50 ký tự";
    }

    if (values.notes.trim().length > 500) {
      nextErrors.notes = "Tối đa 500 ký tự";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(toRequestBody(values));
    } catch (error) {
      const message = apiErrMessage(error);
      const fieldError = mapSubmitErrorToField(message);
      if (fieldError) {
        setErrors((current) => ({ ...current, ...fieldError }));
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <User className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin khách hàng
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Mã khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={values.code}
                      onChange={(event) => updateField("code", event.target.value)}
                      placeholder="VD: KH-001"
                      maxLength={30}
                      className="pl-10 font-mono"
                    />
                  </div>
                  <FieldError msg={errors.code} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Tên khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={values.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nguyễn Văn A / Công ty XYZ"
                    maxLength={200}
                  />
                  <FieldError msg={errors.name} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Người liên hệ
                  </label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={values.contactName}
                      onChange={(event) => updateField("contactName", event.target.value)}
                      placeholder="Họ tên người liên hệ"
                      maxLength={120}
                      className="pl-10"
                    />
                  </div>
                  <FieldError msg={errors.contactName} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={values.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="0901234567"
                      maxLength={20}
                      className="pl-10"
                    />
                  </div>
                  <FieldError msg={errors.phone} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={values.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="email@example.com"
                      maxLength={120}
                      className="pl-10"
                    />
                  </div>
                  <FieldError msg={errors.email} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Mã số thuế
                  </label>
                  <Input
                    value={values.taxCode}
                    onChange={(event) => updateField("taxCode", event.target.value)}
                    placeholder="VD: 0312345678"
                    maxLength={50}
                    className="font-mono"
                  />
                  <FieldError msg={errors.taxCode} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Địa chỉ và ghi chú
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Địa chỉ
                </label>
                <AddressForm
                  value={values.address}
                  onChange={(address) => updateField("address", address)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">
                  Ghi chú
                </label>
                <Textarea
                  value={values.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Yêu cầu giao hàng, thông tin nội bộ..."
                  maxLength={500}
                  className="min-h-24"
                />
                <FieldError msg={errors.notes} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Trạng thái
              </h3>
            </div>
            <Select
              value={values.isActive ? "active" : "inactive"}
              onValueChange={(value) => updateField("isActive", value === "active")}
            >
              <SelectTrigger className="font-medium">
                <span className="flex flex-1 truncate text-left">
                  {values.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {submitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-200 bg-white"
                onClick={() => {
                  if (confirmLeave()) router.push("/customers");
                }}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
