"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { SidebarNavigationItem } from "@/components/sidebar/sidebar-nav-item";
import type { SidebarSectionConfig } from "@/components/sidebar/sidebar-navigation";

type SidebarSectionProps = {
  section: SidebarSectionConfig;
  pathname: string;
  expandedHref: string | null;
  setExpandedHref: (href: string | null) => void;
};

export function SidebarSection({
  section,
  pathname,
  expandedHref,
  setExpandedHref,
}: SidebarSectionProps) {
  return (
    <SidebarGroup className={section.className}>
      <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
        {section.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarNavigationItem
              key={item.href}
              item={item}
              pathname={pathname}
              expandedHref={expandedHref}
              setExpandedHref={setExpandedHref}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
