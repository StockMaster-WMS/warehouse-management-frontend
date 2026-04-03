export const ALL_WAREHOUSES = "__all_warehouses__";
export const UNSELECTED_WAREHOUSE = "__select_warehouse__";
export const LOCATIONS_PAGE_SIZE = 12;

export type LocationFormState = {
    warehouseId: string;
    code: string;
    name: string;
    zone: string;
    aisle: string;
    rack: string;
    level: string;
    bin: string;
    locationType: string;
    isActive: boolean;
};

export const DEFAULT_LOCATION_FORM_STATE: LocationFormState = {
    warehouseId: "",
    code: "",
    name: "",
    zone: "",
    aisle: "",
    rack: "",
    level: "",
    bin: "",
    locationType: "",
    isActive: true,
};
