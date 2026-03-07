import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  AlertCircle,
  Hash,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const products = [
  {
    sku: "IPH15PM-BLK",
    name: "iPhone 15 Pro Max 256GB - Black Titanium",
    category: "Điện thoại",
    location: "Khu A - Dãy 1 - Kệ 2",
    available: 12,
    onHand: 15,
    reserved: 3,
    minStock: 5,
    status: "in-stock"
  },
  {
    sku: "MACM3-SIL",
    name: "MacBook Air M3 13 inch - Silver",
    category: "Laptop",
    location: "Khu B - Dãy 4 - Kệ 1",
    available: 2,
    onHand: 2,
    reserved: 0,
    minStock: 5,
    status: "low-stock"
  },
  {
    sku: "AIRPOD-PRO2",
    name: "AirPods Pro Gen 2 (USB-C)",
    category: "Phụ kiện",
    location: "Khu A - Dãy 2 - Kệ 5",
    available: 45,
    onHand: 48,
    reserved: 3,
    minStock: 10,
    status: "in-stock"
  },
  {
    sku: "IPAD-M2-11",
    name: "iPad Pro M2 11 inch Wi-Fi 128GB",
    category: "Máy tính bảng",
    location: "Khu B - Dãy 1 - Kệ 3",
    available: 0,
    onHand: 0,
    reserved: 0,
    minStock: 5,
    status: "out-of-stock"
  }
];

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Danh mục sản phẩm
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Quản lý thông tin SKU, tồn kho đa điểm và vị trí lưu trữ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200">
            <Download className="mr-2 h-4 w-4" />
            Nhập/Xuất Excel
          </Button>
          <Link href="/products/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none">
              <Plus className="mr-2 h-4 w-4" />
              Tạo mới SKU
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng SKU", value: "248", icon: Hash, color: "text-blue-500" },
          { label: "Hết hàng", value: "12", icon: AlertCircle, color: "text-rose-500" },
          { label: "Vị trí lưu trữ", value: "1,250", icon: MapPin, color: "text-emerald-500" },
          { label: "Giá trị hàng", value: "4.8B ₫", icon: Package, color: "text-indigo-500" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm hàng nhanh theo Tên, SKU hoặc Chủng loại..." 
                className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 border-slate-200">
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sản phẩm & SKU</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Vị trí kho</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Khả dụng</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Hiện có (On-hand)</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((product) => (
                <tr key={product.sku} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{product.name}</span>
                      <span className="text-[11px] font-medium text-slate-500 mt-0.5">{product.sku} • {product.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {product.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{product.available}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{product.onHand}</span>
                      {product.reserved > 0 && (
                        <span className="text-[10px] font-medium text-rose-500">Đặt trước: {product.reserved}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      product.status === 'in-stock' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : product.status === 'low-stock'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {product.status === 'in-stock' ? 'Đang sẵn hàng' : product.status === 'low-stock' ? 'Sắp hết hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuItem className="rounded-lg">
                           <ChevronRight className="mr-2 h-4 w-4" />
                           Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg">
                           <ArrowRightLeft className="mr-2 h-4 w-4" />
                           Chuyển kho
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">
                           Xóa SKU
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Đang hiển thị {products.length} trên 248 sản phẩm</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 px-3 text-xs border-slate-200">Trước</Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-slate-200">Tiếp theo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
