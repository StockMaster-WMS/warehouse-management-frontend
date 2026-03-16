"use client";

import { use } from "react";
import {
  ArrowLeft,
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function EditSupplierPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { id } = params;

  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Chỉnh sửa nhà cung cấp"
        description={`Cập nhật thông tin định danh và hồ sơ năng lực của đối tác (ID: ${id}).`}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                    defaultValue="Apple Asia Distribution"
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                 </div>
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Mã số thuế / GPKD
                  </label>
                  <Input
                    defaultValue="GST-888999-XYZ"
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 font-mono"
                  />
                 </div>
              </div>

               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Địa chỉ trụ sở chính
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                           defaultValue="Quận 1, TP. Hồ Chí Minh, Việt Nam"
                           className="pl-10 min-h-[80px] py-3 text-sm border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
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
                       defaultValue="contact@apple.com.vn"
                       className="pl-10 border-slate-200 bg-slate-50/50"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Số điện thoại
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                       defaultValue="028 3822 xxxx"
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
                  <Select defaultValue="active">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Chọn trạng thái..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Đang hợp tác</SelectItem>
                      <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                      <SelectItem value="inactive">Ngưng cung ứng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        Hạn mức công nợ
                    </label>
                     <Input
                        defaultValue="5,000,000,000 ₫"
                        className="border-slate-200 bg-slate-50/50 font-bold text-indigo-600"
                    />
                </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
             <div className="flex flex-col gap-4">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
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
      </div>
    </div>
  );
}
