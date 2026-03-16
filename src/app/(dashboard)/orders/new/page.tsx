"use client";

import {
  ArrowLeft,
  Save,
  Truck,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  CreditCard
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

export default function NewOrderPage() {
  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Tạo vận đơn / Hành trình"
        description="Khởi tạo lệnh xuất kho và điều phối vận chuyển mới."
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <User className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin người nhận
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Khách hàng / Đối tác <span className="text-rose-500">*</span>
                  </label>
                   <Select>
                    <SelectTrigger className="border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Chọn từ danh sách..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c1">Nguyễn Văn A (098xxxx)</SelectItem>
                      <SelectItem value="c2">Trần Thị B (091xxxx)</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Số điện thoại nhận
                  </label>
                  <Input
                    placeholder="Tự động điền hoặc nhập mới..."
                    className="border-slate-200 bg-slate-50/50"
                  />
                 </div>
              </div>

               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Địa chỉ giao hàng <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                           placeholder="Nhập địa chỉ giao hàng chi tiết..."
                           className="pl-10 min-h-[80px] text-sm border-slate-200 bg-slate-50/50"
                        />
                    </div>
               </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Sản phẩm xuất kho
                </h3>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                 <Plus className="mr-1 h-3 w-3" />
                 Thêm hàng
              </Button>
            </div>
            
            <div className="space-y-4">
               {/* Line Items Table Header */}
               <div className="hidden grid-cols-12 gap-4 px-2 text-[10px] font-bold uppercase text-slate-400 sm:grid">
                  <div className="col-span-6">Sản phẩm / SKU</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-3 text-right">Đơn giá</div>
                  <div className="col-span-1"></div>
               </div>

               {/* Mock Line Item */}
               <div className="grid grid-cols-12 gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-2 items-center dark:border-slate-800 sm:bg-transparent sm:border-0 sm:p-0">
                  <div className="col-span-12 sm:col-span-6">
                      <div className="flex flex-col">
                          <span className="text-sm font-bold">iPhone 15 Pro Max 256GB</span>
                          <span className="text-[10px] text-slate-500 font-mono italic">SKU: IP15PM-256-BLUE</span>
                      </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                      <Input type="number" defaultValue="1" className="h-9 text-center" />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                      <Input defaultValue="31,500,000" className="h-9 text-right font-bold text-indigo-600" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-right">
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-slate-400 hover:text-rose-500">
                         <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
                <Truck className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                 Vận chuyển & Thanh toán
              </h3>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Đơn vị vận chuyển
                  </label>
                  <Select defaultValue="jt">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Chọn đơn vị..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jt">J&T Express</SelectItem>
                      <SelectItem value="ghtk">Giao Hàng Tiết Kiệm</SelectItem>
                      <SelectItem value="ghn">Giao Hàng Nhanh</SelectItem>
                      <SelectItem value="vtp">Viettel Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Phương thức thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="flex h-10 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 cursor-pointer">
                          <CreditCard className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold">Chuyển khoản</span>
                      </div>
                       <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 cursor-pointer hover:bg-slate-50">
                          <Truck className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-bold">COD</span>
                      </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2 rounded-xl bg-slate-900 p-4 dark:bg-slate-800/50">
                    <div className="flex justify-between text-[11px] text-slate-400 uppercase font-bold">
                        <span>Tạm tính</span>
                        <span>31,500,000 ₫</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 uppercase font-bold">
                        <span>Phí vận chuyển</span>
                        <span>35,000 ₫</span>
                    </div>
                    <div className="my-2 border-t border-slate-800"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">TỔNG CỘNG</span>
                        <span className="text-lg font-black text-rose-500">31,535,000 ₫</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
             <div className="flex flex-col gap-4">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none h-12">
                <Save className="mr-2 h-4 w-4" />
                Xác nhận & Xuất kho
              </Button>
              <Button
                render={<Link href="/orders" />}
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
