import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-slate-100">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
