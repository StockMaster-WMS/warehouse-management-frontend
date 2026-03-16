"use client";

import {
  ArrowLeft,
  Save,
  Building2,
  Info,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase
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

export default function NewSupplierPage() {
  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Thêm nhà cung cấp"
        description="Khởi tạo hồ sơ đối tác cung ứng và thông tin liên hệ."
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
                Thông tin doanh nghiệp
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Tên nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Công ty TNHH abc / Hộ kinh doanh..."
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Mã số thuế
                  </label>
                  <Input
                    placeholder="VD: 0101234567"
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                 </div>
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Nhóm ngành hàng
                  </label>
                  <Select defaultValue="thiet_bi">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30">
                      <SelectValue placeholder="Chọn ngành hàng..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thiet_bi">Thiết bị điện tử</SelectItem>
                      <SelectItem value="linh_kien">Linh kiện & Gia dụng</SelectItem>
                      <SelectItem value="phu_kien">Phụ kiện</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

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
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        Người đại diện
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="Họ tên người liên hệ..."
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                   </div>
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        SĐT liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="09xx xxx xxx"
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                   </div>
               </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="email@company.com"
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                   </div>
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        Website (Tuỳ chọn)
                    </label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="https://..."
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                   </div>
               </div>
               
               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Địa chỉ kho / trụ sở <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="Nhập địa chỉ đầy đủ..."
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Trạng thái hoạt động
              </h3>
            </div>
            <div className="space-y-4">
              <Select defaultValue="active">
                <SelectTrigger className="border-slate-200 bg-slate-50/50 font-medium">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-emerald-600 font-medium focus:text-emerald-700">Đang giao dịch</SelectItem>
                  <SelectItem value="paused" className="text-amber-600 font-medium focus:text-amber-700">Tạm dừng</SelectItem>
                  <SelectItem value="blocked" className="text-rose-600 font-medium focus:text-rose-700">Ngừng hợp tác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
                Lưu hồ sơ
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
