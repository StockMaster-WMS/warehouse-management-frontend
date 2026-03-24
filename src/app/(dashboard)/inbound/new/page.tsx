"use client";

import {
  ArrowLeft,
  Save,
  Plus,
  Search,
  Building2,
  Calendar,
  PackagePlus,
  Trash2,
  Info,
  Truck,
  FileUp,
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

export default function NewInboundPage() {
  return (
    <div className="w-full space-y-6 pb-20">
      <PageHeader
        title="Tạo phiếu nhập hàng"
        description="Khởi tạo chứng từ nhập kho và quản lý danh sách mặt hàng thực nhập."
        actions={
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/inbound" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Nhập từ File (Excel/CSV)
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin chung */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Info className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin chứng từ
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
                <div className="space-y-2">
                  <label
                    htmlFor="inbound-date"
                    className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Ngày nhập kho <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="inbound-date"
                      type="date"
                      className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nhà cung cấp <span className="text-rose-500">*</span>
                  </label>
                  <Select>
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30 text-left h-9">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="h-4 w-4" />
                        <SelectValue placeholder="Chọn nhà cung cấp..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apple">
                        Apple Asia Distribution
                      </SelectItem>
                      <SelectItem value="samsung">
                        Samsung Electronics VN
                      </SelectItem>
                      <SelectItem value="logitech">Logitech Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kho hàng nhận <span className="text-rose-500">*</span>
                  </label>
                  <Select defaultValue="main">
                    <SelectTrigger className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30 h-9">
                      <SelectValue placeholder="Chọn kho..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Kho tổng miền Nam</SelectItem>
                      <SelectItem value="north">Cơ sở Hà Nội</SelectItem>
                      <SelectItem value="cold">Kho lạnh - Zone C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inbound-note"
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Ghi chú
                </label>
                <Input
                  id="inbound-note"
                  placeholder="Nhập ghi chú cho chứng từ này (nếu có)..."
                  className="border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          {/* Chọn sản phẩm */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Danh sách sản phẩm
                </h3>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm SKU hoặc tên sản phẩm để thêm..."
                  className="pl-10 h-9 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30 text-sm"
                />
              </div>
            </div>

            <div className="min-h-62.5 bg-slate-50/30 dark:bg-slate-900/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sản phẩm
                      </th>
                      <th className="p-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-32">
                        Số lượng nhập
                      </th>
                      <th className="p-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-32">
                        Đơn giá
                      </th>
                      <th className="p-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            iPhone 15 Pro Max
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            SKU: IPH15-BLK
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Input
                          id="inbound-item-qty-1"
                          type="number"
                          defaultValue="1"
                          className="h-8 text-center bg-white border-slate-200"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <Input
                          id="inbound-item-price-1"
                          type="text"
                          placeholder="0 ₫"
                          className="h-8 text-right bg-white border-slate-200"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center opacity-40">
                <Plus className="h-8 w-8 mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-400 italic">
                  Nhập SKU hoặc tìm kiếm để thêm sản phẩm vào phiếu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar chốt phiếu */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Truck className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Vận tải & Kho
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Kho đích
                </label>
                <Select defaultValue="main">
                  <SelectTrigger className="border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Chọn kho..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Kho tổng miền Nam</SelectItem>
                    <SelectItem value="north">Cơ sở Hà Nội</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hình thức vận chuyển
                </label>
                <Select defaultValue="air">
                  <SelectTrigger className="border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Chọn hình thức..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Hàng không</SelectItem>
                    <SelectItem value="sea">Đường biển</SelectItem>
                    <SelectItem value="road">Đường bộ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  i
                </div>
                <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                  Sau khi &quot;Lưu kế hoạch&quot;, phiếu sẽ ở trạng thái Chờ và có thể in
                  Phiếu soạn hàng cho NV kho.
                </p>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Save className="mr-2 h-4 w-4" />
                Lưu kế hoạch nhập
              </Button>
              <Button
                render={<Link href="/inbound" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-slate-200 bg-white"
              >
                Hủy phiếu
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
