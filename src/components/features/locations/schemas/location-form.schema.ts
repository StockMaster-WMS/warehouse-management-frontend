import type { LocationFormState } from "@/components/features/locations/constants";

export type LocationUpsertPayload = {
    warehouseId: string;
    code: string;
    name?: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    level?: number;
    bin?: string;
    locationType?: string;
    isActive: boolean;
};

export type BuildLocationPayloadResult =
    | { payload: LocationUpsertPayload; errorMessage?: never }
    | { payload?: never; errorMessage: string };

function toOptional(value: string) {
    const trimmed = value.trim();
    return trimmed || undefined;
}

export function buildLocationUpsertPayload(
    formState: LocationFormState,
): BuildLocationPayloadResult {
    const warehouseId = formState.warehouseId.trim();
    const code = formState.code.trim();

    if (!warehouseId) {
        return { errorMessage: "Vui lòng chọn kho" };
    }

    if (!code) {
        return { errorMessage: "Vui lòng nhập mã vị trí" };
    }

    const levelText = formState.level.trim();
    const parsedLevel = levelText ? Number(levelText) : undefined;

    if (typeof parsedLevel === "number" && Number.isNaN(parsedLevel)) {
        return { errorMessage: "Level phải là số hợp lệ" };
    }

    return {
        payload: {
            warehouseId,
            code,
            name: toOptional(formState.name),
            zone: toOptional(formState.zone),
            aisle: toOptional(formState.aisle),
            rack: toOptional(formState.rack),
            level: parsedLevel,
            bin: toOptional(formState.bin),
            locationType: toOptional(formState.locationType),
            isActive: formState.isActive,
        },
    };
}
