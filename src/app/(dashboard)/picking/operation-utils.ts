import type { PickingItem } from "@/types/picking-item";

export type PickingPriority = "high" | "medium" | "low";
export type PickingOrderSort = "sequence" | "order" | "location";

export type PickingOrder = {
  soNumber: string;
  items: PickingItem[];
  locations: string[];
  totalToPick: number;
  totalPicked: number;
  progress: number;
  priority: PickingPriority;
};

export type PickingLocationGroup = {
  location: string;
  items: PickingItem[];
  orderNumbers: string[];
  totalToPick: number;
  totalPicked: number;
};

export function displayPickingLocation(item: PickingItem) {
  return item.locationCode || item.locationName || "Chưa rõ";
}

function sequenceValue(item: PickingItem) {
  return Number(item.pickSequence ?? Number.MAX_SAFE_INTEGER);
}

function compareItemsBySequence(a: PickingItem, b: PickingItem) {
  const sequenceDiff = sequenceValue(a) - sequenceValue(b);
  if (sequenceDiff !== 0) return sequenceDiff;
  return displayPickingLocation(a).localeCompare(displayPickingLocation(b), "vi");
}

function priorityForIndex(index: number): PickingPriority {
  if (index === 0) return "high";
  if (index === 1) return "medium";
  return "low";
}

function summarizeOrder(soNumber: string, items: PickingItem[], index: number): PickingOrder {
  const totalToPick = items.reduce((sum, item) => sum + Number(item.qtyToPick || 0), 0);
  const totalPicked = items.reduce((sum, item) => sum + Number(item.qtyPicked || 0), 0);
  return {
    soNumber,
    items,
    locations: Array.from(new Set(items.map(displayPickingLocation))),
    totalToPick,
    totalPicked,
    progress: totalToPick ? Math.round((totalPicked / totalToPick) * 100) : 0,
    priority: priorityForIndex(index),
  };
}

function firstLocation(order: PickingOrder) {
  return order.locations[0] ?? "";
}

export function groupPickingOrders(
  items: PickingItem[],
  sort: PickingOrderSort = "sequence",
): PickingOrder[] {
  const grouped = new Map<string, PickingItem[]>();
  [...items].sort(compareItemsBySequence).forEach((item) => {
    const key = item.salesOrderNumber || "SO chưa gắn";
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });

  const orders = Array.from(grouped.entries()).map(([soNumber, orderItems], index) =>
    summarizeOrder(soNumber, orderItems, index),
  );

  orders.sort((a, b) => {
    if (sort === "order") {
      return a.soNumber.localeCompare(b.soNumber, "vi", { numeric: true });
    }
    if (sort === "location") {
      return firstLocation(a).localeCompare(firstLocation(b), "vi", { numeric: true });
    }
    return sequenceValue(a.items[0]) - sequenceValue(b.items[0]);
  });

  return orders.map((order, index) => ({ ...order, priority: priorityForIndex(index) }));
}

export function groupPickingLocations(items: PickingItem[]): PickingLocationGroup[] {
  const grouped = new Map<string, PickingItem[]>();
  [...items].sort(compareItemsBySequence).forEach((item) => {
    const key = displayPickingLocation(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b, "vi", { numeric: true }))
    .map(([location, locationItems]) => ({
      location,
      items: locationItems,
      orderNumbers: Array.from(
        new Set(locationItems.map((item) => item.salesOrderNumber || "SO chưa gắn")),
      ),
      totalToPick: locationItems.reduce((sum, item) => sum + Number(item.qtyToPick || 0), 0),
      totalPicked: locationItems.reduce((sum, item) => sum + Number(item.qtyPicked || 0), 0),
    }));
}
