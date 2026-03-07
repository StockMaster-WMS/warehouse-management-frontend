import { Settings, UserCog, Database, Bell, Palette, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Cài đặt hệ thống
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Tùy cấu hình hoạt động của kho và quản lý ứng dụng của bạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-1">
           {[
             { label: "Cá nhân", icon: UserCog, active: true },
             { label: "Thông báo", icon: Bell },
             { label: "Giao diện", icon: Palette },
             { label: "Dữ liệu", icon: Database },
           ].map((item, i) => (
             <button key={i} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${item.active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
             </button>
           ))}
        </div>

        <div className="lg:col-span-3">
           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[400px]">
              <div className="mb-6 flex items-center justify-between border-b pb-4 dark:border-slate-800">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h2>
                 <Button className="bg-indigo-600 hover:bg-indigo-700">Lưu thay đổi</Button>
              </div>
              <div className="flex items-center justify-center p-20 text-center opacity-50">
                 <div className="flex flex-col gap-2">
                    <Settings className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">Form cài đặt hiện đang được hoàn thiện.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
