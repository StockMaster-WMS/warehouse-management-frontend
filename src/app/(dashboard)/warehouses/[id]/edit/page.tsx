"use client";

import { use } from "react";
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Settings,
  Scale
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";

export default function EditWarehousePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { id } = params;

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20">
      <PageHeader
        title="Cập nhật thông tin kho"
        description={`Điều chỉnh cấu trúc và thông tin quản lý của kho (ID: ${id}).`}
        actions={
          <Button
            render={<Link href="/warehouses" />}
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
                Thông tin cơ sở
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Mã phân quyền
                  </label>
                  <Input
                    defaultValue={id}
                    disabled
                    className="border-slate-200 bg-slate-100 font-mono text-sm uppercase"
                  />
                 </div>
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Định danh tên kho <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    defaultValue="Kho tổng miền Bắc"
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                 </div>
              </div>

               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Địa chỉ cơ sở mốc <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                           defaultValue="KCN Quang Minh, Mê Linh, Hà Nội"
                           className="pl-10 min-h-20 py-3 text-sm border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
               </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Settings className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Bố cục Cấu trúc Không Gian
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Số dãy kho (Zone)
                </label>
                <Input
                  type="number"
                  defaultValue="12"
                  className="border-slate-200 text-center bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Tầng, Kệ, Ô
                </label>
                <div className="grid grid-cols-3 gap-1">
                   <Input type="number" defaultValue="5" className="px-1 text-center h-10 border-slate-200 bg-slate-50/50" />
                   <Input type="number" defaultValue="8" className="px-1 text-center h-10 border-slate-200 bg-slate-50/50" />
                   <Input type="number" defaultValue="20" className="px-1 text-center h-10 border-slate-200 bg-slate-50/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Scale className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                 Trạng Thái Vận Hành
              </h3>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex h-10 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4">
                        <span className="text-sm font-bold text-emerald-800">Đang hoạt động</span>
                        <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-emerald-500">
                             <div className="absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow translate-x-3.5 transition"></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
             <div className="flex flex-col gap-4">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
                Lưu cập nhật
              </Button>
              <Button
                render={<Link href="/warehouses" />}
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
