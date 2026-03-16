"use client";

import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
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

export default function NewCustomerPage() {
  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Thêm khách hàng"
        description="Tạo hồ sơ khách hàng mới để quản lý thông tin liên hệ và lịch sử mua hàng."
        actions={
          <Button
            render={<Link href="/customers" />}
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
              <User className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin cá nhân / Doanh nghiệp
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                     Họ và tên / Tên đơn vị <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="Nguyễn Văn A / Công ty XYZ..."
                    className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                  />
                 </div>
                 <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Phân loại
                  </label>
                  <Select defaultValue="ca_nhan">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30">
                      <SelectValue placeholder="Chọn phân loại..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca_nhan">Cá nhân</SelectItem>
                      <SelectItem value="nha_buon">Nhà buôn / Sỉ</SelectItem>
                      <SelectItem value="doanh_nghiep">Doanh nghiệp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                        placeholder="email@example.com"
                        className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                        />
                    </div>
                   </div>
               </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Địa chỉ giao hàng
              </h3>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                         Địa chỉ chi tiết
                    </label>
                    <Textarea
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        className="min-h-[100px] border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                    />
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin bổ sung
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Nhóm khách hàng
                </label>
                <Select defaultValue="moi">
                  <SelectTrigger className="border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Chọn nhóm..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moi">Khách hàng mới</SelectItem>
                    <SelectItem value="tiem_nang">Tiềm năng</SelectItem>
                    <SelectItem value="than_thiet">Thân thiết</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Ghi chú nội bộ
                </label>
                <Textarea
                  placeholder="Đặc điểm nhận dạng, sở thích, yêu cầu riêng..."
                  className="min-h-[80px] border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
                Lưu khách hàng
              </Button>
              <Button
                render={<Link href="/customers" />}
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
