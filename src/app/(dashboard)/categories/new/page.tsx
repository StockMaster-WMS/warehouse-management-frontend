"use client";

import {
  ArrowLeft,
  Save,
  Tag,
  Info,
  FolderTree,
  Package
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";

export default function NewCategoryPage() {
  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Thêm nhóm hàng"
        description="Tạo danh mục mới để phân loại và quản lý sản phẩm."
        actions={
          <Button
            render={<Link href="/categories" />}
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
              <Tag className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin cơ bản phân loại
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Mã nhóm hàng <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="VD: CAT-01"
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 uppercase font-mono"
                  />
                 </div>
              </div>

               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Tên nhóm / Phân loại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <FolderTree className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                           placeholder="Điện thoại, Tivi, Tủ Lạnh..."
                           className="pl-10 text-sm border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 font-bold"
                        />
                    </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Mô tả chức năng (Tuỳ chọn)
                  </label>
                   <div className="relative">
                        <Info className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                           placeholder="Ghi chú thêm về nhóm hàng này dùng mục đích gì..."
                           className="pl-10 min-h-[120px] py-3 text-sm border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Package className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                 Đặc Tính Hiển Thị
              </h3>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex h-10 items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4">
                        <span className="text-sm font-bold text-emerald-800">Hiển thị khi phân loại</span>
                        <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-emerald-500">
                             <div className="absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow translate-x-3.5 transition"></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
             <div className="flex flex-col gap-4">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
                Lưu xác nhận
              </Button>
              <Button
                render={<Link href="/categories" />}
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
