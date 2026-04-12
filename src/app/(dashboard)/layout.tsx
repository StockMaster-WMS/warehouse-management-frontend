import { cookies } from "next/headers";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasSession = AUTH_SESSION_COOKIE_NAMES.some((name) =>
    cookieStore.has(name)
  );

  return (
    <AuthGuard initialHasSession={hasSession}>
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
