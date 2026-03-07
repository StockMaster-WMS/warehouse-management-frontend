import { ShieldCheck, Key, Users, Eye, History, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Bảo mật & Phân quyền
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Quản lý quyền truy cập và bảo vệ dữ liệu kho an toàn tuyệt đối.
          </p>
        </div>
        <Button variant="outline" size="sm" className="bg-indigo-600/5 hover:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-600/20">
           Kiểm tra bảo mật định kỳ
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         {[
           { title: "Vai trò & Quyền hạn", desc: "Quản lý các nhóm quản trị, thủ kho và nhân viên đóng gói.", icon: Users },
           { title: "Khóa truy cập", desc: "Thiết lập đăng nhập 2 lớp (2FA) và quản lý mật khẩu phức tạp.", icon: Key },
           { title: "Nhật ký truy cập", desc: "Theo dõi địa chỉ IP và lịch sử đăng nhập vào hệ thống.", icon: Eye },
           { title: "Cảnh báo bảo mật", desc: "Cấu hình thông báo khi có hoạt động đăng nhập bất thường.", icon: BellRing },
         ].map((item, i) => (
           <div key={i} className="group flex items-start gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-900/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                 <item.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                 <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                 <p className="text-sm font-medium text-slate-500 leading-normal">{item.desc}</p>
                 <Button variant="link" size="sm" className="justify-start p-0 h-auto text-indigo-600">Thiết lập ngay</Button>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
