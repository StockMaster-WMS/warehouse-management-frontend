import type { Location } from "@/types/location";

export function formatLocationZoneLine(location: Location) {
    const zone = location.zone || "-";
    const aisle = location.aisle || "-";
    const rack = location.rack || "-";
    return `Z:${zone} - A:${aisle} - R:${rack}`;
}

export function matchesLocationKeyword(location: Location, keyword: string) {
    if (!keyword) {
        return true;
    }

    const normalizedKeyword = keyword.toLowerCase();
    const searchable = [
        location.code,
        location.zone,
        location.aisle,
        location.rack,
        location.bin,
        location.locationType,
        location.status,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchable.includes(normalizedKeyword);
}
