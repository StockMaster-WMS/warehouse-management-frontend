import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-white">
            <AppSidebar />

            <main className="min-w-0 flex-1 bg-white px-8 py-6">
                <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>
        </div>
    );
}
