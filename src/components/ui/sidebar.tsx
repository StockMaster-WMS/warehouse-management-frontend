"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebarContext(): SidebarContextValue {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("Sidebar components must be used within SidebarProvider");
  }

  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  const { collapsed } = useSidebarContext();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-slate-800/80 bg-slate-900 text-slate-100 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="flex h-full flex-col">{children}</div>
    </aside>
  );
}

export function SidebarHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <header className={cn("border-b border-slate-800/80 p-3", className)}>{children}</header>;
}

export function SidebarContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-1 px-2 py-4", className)}>{children}</div>;
}

export function SidebarFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <footer className={cn("border-t border-slate-800/80 p-3", className)}>{children}</footer>;
}

export function SidebarGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("mb-5", className)}>{children}</section>;
}

export function SidebarGroupLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  const { collapsed } = useSidebarContext();

  if (collapsed) {
    return null;
  }

  return (
    <p className={cn("px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400", className)}>
      {children}
    </p>
  );
}

export function SidebarMenu({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function SidebarMenuItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>;
}

type SidebarMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function SidebarMenuButton({ className, active, children, ...props }: SidebarMenuButtonProps) {
  return (
    <button
      className={cn(
        "flex h-10 w-full items-center rounded-md px-2 text-sm transition-colors",
        active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarMenuLink({
  className,
  active,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { active?: boolean }) {
  return (
    <a
      className={cn(
        "flex h-10 items-center rounded-md px-2 text-sm transition-colors",
        active
          ? "bg-slate-800 text-white"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function SidebarMenuSub({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ml-5 mt-1 space-y-1 border-l border-slate-800/80 pl-3", className)}>{children}</div>;
}

export function SidebarInset({ className, children }: { className?: string; children: React.ReactNode }) {
  return <main className={cn("min-w-0 flex-1 p-4 md:p-8", className)}>{children}</main>;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, setCollapsed } = useSidebarContext();

  return (
    <button
      type="button"
      onClick={() => setCollapsed((prev) => !prev)}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
        className
      )}
      aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function useSidebar() {
  return useSidebarContext();
}
