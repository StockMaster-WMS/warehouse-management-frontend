"use client";

import { memo, useEffect } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CHILD_ICON_COLOR_CLASSES,
  isActivePath,
  stableHrefToId,
} from "@/components/sidebar/sidebar-navigation";
import type { SidebarNavItem as SidebarNavItemConfig } from "@/components/sidebar/sidebar-navigation";

type SidebarNavItemProps = {
  item: SidebarNavItemConfig;
  pathname: string;
  expandedHref: string | null;
  setExpandedHref: (href: string | null) => void;
};

export const SidebarNavigationItem = memo(function SidebarNavigationItem({
  item,
  pathname,
  expandedHref,
  setExpandedHref,
}: SidebarNavItemProps) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const expanded = expandedHref === item.href;
  const showChildren = hasChildren && expanded;

  useEffect(() => {
    if (active && hasChildren) {
      setExpandedHref(item.href);
    }
  }, [active, hasChildren, item.href, setExpandedHref]);

  const handleToggleChildren = (
    event: MouseEvent | KeyboardEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedHref(expanded ? null : item.href);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} id={stableHrefToId(item.href)} />}
        isActive={active}
        tooltip={item.label}
        onClick={() => {
          if (!hasChildren) setExpandedHref(null);
        }}
        className={cn(
          "relative h-10 w-full px-4 pr-9 transition-all duration-200",
          "hover:bg-slate-100/90 hover:text-slate-900",
          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
          active &&
            "bg-indigo-50 text-indigo-700 font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)] hover:bg-indigo-50 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-colors group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-6",
            active
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 group-hover:text-slate-900",
          )}
        />
        <span className="text-sm group-data-[collapsible=icon]:hidden">
          {item.label}
        </span>

        {item.tag ? (
          <span className="ml-auto mr-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 group-data-[collapsible=icon]:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {item.tag}
          </span>
        ) : null}

        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={showChildren ? "Thu gọn mục con" : "Mở rộng mục con"}
            onClick={handleToggleChildren}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleToggleChildren(event);
              }
            }}
            className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 group-data-[collapsible=icon]:hidden dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                showChildren ? "rotate-90 text-indigo-500" : "rotate-0",
              )}
            />
          </span>
        ) : null}

        {active ? (
          <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 group-data-[collapsible=icon]:hidden" />
        ) : null}
      </SidebarMenuButton>

      {showChildren ? (
        <div className="mb-1 mt-0.5 space-y-0.5 pl-4 pr-3 group-data-[collapsible=icon]:hidden">
          {item.children?.map((child) => {
            const childActive = isActivePath(pathname, child.href);
            const ChildIcon = child.icon;
            const iconClass = child.color
              ? CHILD_ICON_COLOR_CLASSES[child.color]
              : "bg-slate-100 text-slate-500";

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[12.5px] font-medium transition-all",
                  "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                  childActive &&
                    "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/40 dark:text-indigo-300",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all",
                    childActive
                      ? iconClass
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                  )}
                >
                  <ChildIcon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{child.label}</span>
                {childActive ? (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </SidebarMenuItem>
  );
});
