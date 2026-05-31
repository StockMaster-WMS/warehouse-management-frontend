import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { SearchableSelect } from "../ui/searchable-select";

interface AddressFormProps {
    value?: AddressValue;
    onChange?: (value: AddressValue) => void;
    required?: boolean;
}

export interface AddressValue {
    street: string;
    provinceCode: string;
    provinceName: string;
    districtCode: string;
    districtName: string;
    wardCode: string;
    wardName: string;
}

type SelectOption = {
    label: string;
    value: string;
};

function getOptionLabel(list: SelectOption[], value: string) {
    return list.find((item) => item.value === value)?.label || "";
}

function normalizeAddressName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(tinh|thanh pho|tp|phuong|xa|thi tran)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function findOptionValueByLabel(list: SelectOption[], label: string) {
    const normalizedLabel = normalizeAddressName(label);
    if (!normalizedLabel) return "";
    return list.find((item) => normalizeAddressName(item.label) === normalizedLabel)?.value || "";
}

function withSelectedOption(options: SelectOption[], value: string, label: string) {
    if (!value || options.some((item) => item.value === value)) return options;
    return [{ value, label: label || value }, ...options];
}

function normalizeAddressValue(value?: Partial<AddressValue>): AddressValue {
    return {
        street: value?.street ?? "",
        provinceCode: value?.provinceCode ?? "",
        provinceName: value?.provinceName ?? "",
        districtCode: value?.districtCode ?? "",
        districtName: value?.districtName ?? "",
        wardCode: value?.wardCode ?? "",
        wardName: value?.wardName ?? "",
    };
}

async function loadProvinceOptions(): Promise<SelectOption[]> {
    const response = await fetch("https://provinces.open-api.vn/api/v2/p/");
    if (!response.ok) throw new Error("Không tải được danh sách tỉnh/thành");

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return [];

    const options: SelectOption[] = [];
    for (const item of data) {
        const label = String((item as { name?: string }).name || "");
        const value = String((item as { code?: string | number }).code || "");
        if (label && value) options.push({ label, value });
    }
    return options;
}

async function loadWardOptions(provinceCode: string): Promise<SelectOption[]> {
    let response = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`);
    if (!response.ok) {
        response = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
    }
    if (!response.ok) throw new Error("Không tải được danh sách phường/xã");

    const data = (await response.json()) as unknown;
    const rows = Array.isArray(data)
        ? data
        : Array.isArray((data as { wards?: unknown[] } | null)?.wards)
            ? (data as { wards: unknown[] }).wards
            : [];

    const options: SelectOption[] = [];
    for (const item of rows) {
        const label = String((item as { name?: string }).name || "");
        const value = String((item as { code?: string | number }).code || "");
        if (label && value) options.push({ label, value });
    }
    return options;
}

export const AddressForm: React.FC<AddressFormProps> = ({ value, onChange, required }) => {
    const [provinces, setProvinces] = useState<SelectOption[]>([]);
    const [wards, setWards] = useState<SelectOption[]>([]);
    const [wardsProvinceCode, setWardsProvinceCode] = useState("");
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingWards, setLoadingWards] = useState(false);
    const [loadingWardsProvinceCode, setLoadingWardsProvinceCode] = useState("");
    const [uncontrolledAddress, setUncontrolledAddress] = useState<AddressValue>(() =>
        normalizeAddressValue(value)
    );
    const rawAddress = value ? normalizeAddressValue(value) : uncontrolledAddress;
    const resolvedProvinceCode =
        rawAddress.provinceCode || findOptionValueByLabel(provinces, rawAddress.provinceName);
    const resolvedProvinceName =
        getOptionLabel(provinces, resolvedProvinceCode) || rawAddress.provinceName;
    const wardsForSelectedProvince =
        resolvedProvinceCode && wardsProvinceCode === resolvedProvinceCode ? wards : [];
    const resolvedWardCode =
        rawAddress.wardCode || findOptionValueByLabel(wardsForSelectedProvince, rawAddress.wardName);
    const resolvedWardName =
        getOptionLabel(wardsForSelectedProvince, resolvedWardCode) || rawAddress.wardName;
    const address: AddressValue = {
        ...rawAddress,
        provinceCode: resolvedProvinceCode,
        provinceName: resolvedProvinceName,
        wardCode: resolvedWardCode,
        wardName: resolvedWardName,
    };

    const provinceOptions = withSelectedOption(provinces, address.provinceCode, address.provinceName);
    const wardOptions = withSelectedOption(wardsForSelectedProvince, address.wardCode, address.wardName);
    const isLoadingSelectedWards =
        Boolean(address.provinceCode) &&
        loadingWards &&
        loadingWardsProvinceCode === address.provinceCode;

    function commitAddress(nextAddress: AddressValue) {
        setUncontrolledAddress(nextAddress);
        onChange?.(nextAddress);
    }

    function updateAddress(updater: (current: AddressValue) => AddressValue) {
        commitAddress(updater(address));
    }

    useEffect(() => {
        let active = true;
        async function init() {
            try {
                const options = await loadProvinceOptions();
                if (!active) return;
                setProvinces(options);
            } finally {
                if (active) setLoadingProvinces(false);
            }
        }
        void init();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!address.provinceCode) {
            return;
        }

        let active = true;
        const provinceCode = address.provinceCode;

        async function loadWardsForProvince() {
            try {
                setLoadingWards(true);
                setLoadingWardsProvinceCode(provinceCode);
                const wardOptions = await loadWardOptions(provinceCode);
                if (active) {
                    setWards(wardOptions);
                    setWardsProvinceCode(provinceCode);
                }
            } catch {
                if (active) {
                    setWards([]);
                    setWardsProvinceCode(provinceCode);
                }
            } finally {
                if (active) {
                    setLoadingWards(false);
                    setLoadingWardsProvinceCode("");
                }
            }
        }

        void loadWardsForProvince();
        return () => { active = false; };
    }, [address.provinceCode]);

    return (
        <div className="space-y-4">
            {/* Province */}
            <div className="space-y-1.5">
                <label htmlFor="address-province" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tỉnh / Thành phố
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <SearchableSelect
                    value={address.provinceCode}
                    onValueChange={(val) => {
                        if (val) {
                            const provinceName = getOptionLabel(provinces, val);
                            commitAddress({ ...address, provinceCode: val, provinceName, districtCode: "", districtName: "", wardCode: "", wardName: "" });
                        }
                    }}
                    options={provinceOptions}
                    dialogTitle="Chọn tỉnh / thành phố"
                    placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}
                    searchPlaceholder="Tìm tỉnh/thành..."
                    emptyText="Không có tỉnh/thành phù hợp"
                    disabled={loadingProvinces || provinceOptions.length === 0}
                    loading={loadingProvinces}
                    className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30"
                />
            </div>

            {/* Ward */}
            <div className="space-y-1.5">
                <label htmlFor="address-ward" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phường / Xã
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <SearchableSelect
                    value={address.wardCode}
                    onValueChange={(val) => {
                        if (val) {
                            const wardName = getOptionLabel(wardOptions, val);
                            commitAddress({ ...address, wardCode: val, wardName });
                        }
                    }}
                    options={wardOptions}
                    dialogTitle="Chọn phường / xã"
                    placeholder={!address.provinceCode ? "Chọn tỉnh/thành trước" : isLoadingSelectedWards ? "Đang tải..." : "Chọn phường/xã"}
                    searchPlaceholder="Tìm phường/xã..."
                    emptyText="Không có phường/xã phù hợp"
                    disabled={!address.provinceCode || isLoadingSelectedWards || wardOptions.length === 0}
                    loading={isLoadingSelectedWards}
                    className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30"
                />
            </div>

            {/* Street */}
            <div className="space-y-1.5">
                <label htmlFor="address-street" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Số nhà, tên đường
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <Input
                    id="address-street"
                    name="street"
                    autoComplete="street-address"
                    value={address.street}
                    onChange={e => updateAddress(a => ({ ...a, street: e.target.value }))}
                    required={required}
                    placeholder="VD: 154 Tôn Đức Thắng..."
                />
            </div>
        </div>
    );
};
