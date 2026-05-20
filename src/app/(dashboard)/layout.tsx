import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: {
    default: "Bảng điều khiển",
    template: "%s | StockMaster WMS",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-h-svh bg-muted">
          <Navbar />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8"
          >
            <Suspense>
              <div className="mx-auto w-full max-w-8xl">{children}</div>
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
