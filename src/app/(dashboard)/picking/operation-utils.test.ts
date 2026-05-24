import { describe, expect, it } from "vitest";

import { groupPickingLocations, groupPickingOrders } from "./operation-utils";
import type { PickingItem } from "@/types/picking-item";

function task(partial: Partial<PickingItem>): PickingItem {
  return {
    id: "pick",
    soItemId: "line",
    productId: "product",
    locationId: "location",
    qtyToPick: 1,
    status: "PENDING",
    ...partial,
  };
}

describe("picking operation grouping", () => {
  const items = [
    task({ id: "pick-2", salesOrderNumber: "SO-20", locationCode: "B-02", pickSequence: 2, qtyToPick: 3 }),
    task({ id: "pick-1", salesOrderNumber: "SO-10", locationCode: "A-01", pickSequence: 1, qtyToPick: 2, qtyPicked: 1 }),
    task({ id: "pick-3", salesOrderNumber: "SO-10", locationCode: "B-02", pickSequence: 3, qtyToPick: 4 }),
  ];

  it("summarizes orders in pick-sequence order", () => {
    const orders = groupPickingOrders(items);

    expect(orders.map((order) => order.soNumber)).toEqual(["SO-10", "SO-20"]);
    expect(orders[0]).toMatchObject({
      totalToPick: 6,
      totalPicked: 1,
      locations: ["A-01", "B-02"],
      priority: "high",
    });
  });

  it("groups the location queue across orders", () => {
    const locations = groupPickingLocations(items);

    expect(locations.map((group) => group.location)).toEqual(["A-01", "B-02"]);
    expect(locations[1]).toMatchObject({
      orderNumbers: ["SO-20", "SO-10"],
      totalToPick: 7,
    });
  });
});
