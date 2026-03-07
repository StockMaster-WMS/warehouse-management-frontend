"use client";

import { 
  ArrowLeft, 
  Save, 
  Package, 
  Info, 
  Settings2, 
  Boxes,
  Ruler,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tạo mới SKU sản phẩm
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Thiết lập thông tin định danh và cấu hình vận hành cho mặt hàng mới.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Thông tin định danh</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mã SKU <span className="text-rose-500">*</span></label>
                  <Input placeholder="VD: IPH15-BLK-256" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Barcode (EAN/UPC)</label>
                  <Input placeholder="0123456789012" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tên sản phẩm <span className="text-rose-500">*</span></label>
                <Input placeholder="Nhập tên đầy đủ của mặt hàng..." className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nhóm hàng</label>
                  <Select>
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30">
                      <SelectValue placeholder="Chọn nhóm hàng..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dt">Điện thoại</SelectItem>
                      <SelectItem value="lt">Laptop</SelectItem>
                      <SelectItem value="pk">Phụ kiện</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đơn vị tính</label>
                  <Select defaultValue="cai">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30">
                      <SelectValue placeholder="Chọn ĐVT..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cai">Cái / Chiếc</SelectItem>
                      <SelectItem value="thung">Thùng</SelectItem>
                      <SelectItem value="hop">Hộp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông số vận hành */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Ruler className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Quy cách & Vận chuyển</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dài (cm)</label>
                <Input type="number" placeholder="0" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Rộng (cm)</label>
                <Input type="number" placeholder="0" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cao (cm)</label>
                <Input type="number" placeholder="0" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nặng (gr)</label>
                <Input type="number" placeholder="0" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Cột phụ: Cấu hình tồn kho */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Ngưỡng báo động</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tồn tối thiểu</label>
                <Input type="number" defaultValue="5" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
                <p className="text-[10px] font-medium text-slate-400 italic italic">Cảnh báo khi kho thấp hơn mức này.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tồn tối đa</label>
                <Input type="number" defaultValue="100" className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30" />
                <p className="text-[10px] font-medium text-slate-400 italic">Dùng để tính tỷ lệ lấp đầy kho.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
             <div className="flex flex-col gap-4">
               <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                 <Save className="mr-2 h-4 w-4" />
                 Lưu sản phẩm
               </Button>
               <Link href="/products" className="w-full">
                 <Button variant="outline" className="w-full border-slate-200 bg-white">Hủy bỏ</Button>
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
