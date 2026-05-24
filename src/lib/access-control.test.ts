import { describe, expect, it } from "vitest";

import { canAccessPath, getDefaultPathForRoles } from "./access-control";
import { filterSidebarSections, SIDEBAR_SECTIONS } from "@/components/sidebar/sidebar-navigation";

describe("access control", () => {
  it("routes warehouse staff to picking and keeps admin settings restricted", () => {
    expect(getDefaultPathForRoles(["WAREHOUSE_STAFF"])).toBe("/picking");
    expect(canAccessPath("/picking", ["WAREHOUSE_STAFF"])).toBe(true);
    expect(canAccessPath("/settings", ["WAREHOUSE_STAFF"])).toBe(false);
  });

  it("keeps picking and security navigation aligned with role access", () => {
    const staffLabels = filterSidebarSections(SIDEBAR_SECTIONS, ["WAREHOUSE_STAFF"])
      .flatMap((section) => section.items.map((item) => item.label));
    const adminLabels = filterSidebarSections(SIDEBAR_SECTIONS, ["ADMIN"])
      .flatMap((section) => section.items.map((item) => item.label));

    expect(staffLabels).toContain("Lấy hàng");
    expect(staffLabels).not.toContain("Bảo mật & phân quyền");
    expect(adminLabels).toContain("Bảo mật & phân quyền");
  });
});
