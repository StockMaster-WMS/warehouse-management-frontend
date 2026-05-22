import { describe, expect, it } from "vitest";

import { newOrderSchema } from "./newOrderSchema";

const validOrder = {
  customerId: "customer-1",
  customerName: "Khach hang A",
  street: "154 Ton Duc Thang",
  wardCode: "ward-1",
  provinceCode: "province-1",
  country: "VN",
  warehouseId: "warehouse-1",
  priority: 5,
};

describe("newOrderSchema", () => {
  it("accepts the order fields required by the create flow", () => {
    expect(newOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it("rejects missing warehouse and invalid priority", () => {
    const result = newOrderSchema.safeParse({
      ...validOrder,
      warehouseId: "",
      priority: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.warehouseId).toContain("Chọn kho xuất");
      expect(result.error.flatten().fieldErrors.priority).toContain(
        "Độ ưu tiên phải là số nguyên >= 1",
      );
    }
  });
});
