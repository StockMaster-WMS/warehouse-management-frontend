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
    const response = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`);
    if (!response.ok) throw new Error("Không tải được danh sách phường/xã");

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

export const AddressForm: React.FC<AddressFormProps> = ({ value, onChange, required }) => {
    const [provinces, setProvinces] = useState<SelectOption[]>([]);
    const [wards, setWards] = useState<SelectOption[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [address, setAddress] = useState<AddressValue>(
        value || { street: "", provinceCode: "", provinceName: "", districtCode: "", districtName: "", wardCode: "", wardName: "" }
    );

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
            setWards([]);
            return;
        }

        let active = true;

        async function loadWardsForProvince() {
            try {
                const wardOptions = await loadWardOptions(address.provinceCode);
                if (active) setWards(wardOptions);
            } catch {
                if (active) setWards([]);
            }
        }

        const provinceName = getOptionLabel(provinces, address.provinceCode);
        if (provinceName && provinceName !== address.provinceName) {
            setAddress((current) =>
                current.provinceCode === address.provinceCode
                    ? { ...current, provinceName }
                    : current
            );
        }
        void loadWardsForProvince();
        return () => { active = false; };
    }, [address.provinceCode, address.provinceName, provinces]);

    // Propagate changes
    useEffect(() => {
        onChange?.(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    return (
        <div className="space-y-4">
            {/* Province */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tỉnh / Thành phố
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <SearchableSelect
                    value={address.provinceCode}
                    onValueChange={(val) => {
                        if (val) {
                            const provinceName = getOptionLabel(provinces, val);
                            setAddress(a => ({ ...a, provinceCode: val, provinceName, districtCode: "", districtName: "", wardCode: "", wardName: "" }));
                        }
                    }}
                    options={provinces}
                    dialogTitle="Chọn tỉnh / thành phố"
                    placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}
                    searchPlaceholder="Tìm tỉnh/thành..."
                    emptyText="Không có tỉnh/thành phù hợp"
                    disabled={loadingProvinces || provinces.length === 0}
                    className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30"
                />
            </div>

            {/* Ward */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phường / Xã
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <SearchableSelect
                    value={address.wardCode}
                    onValueChange={(val) => {
                        if (val) {
                            const wardName = getOptionLabel(wards, val);
                            setAddress(a => ({ ...a, wardCode: val, wardName }));
                        }
                    }}
                    options={wards}
                    dialogTitle="Chọn phường / xã"
                    placeholder={!address.provinceCode ? "Chọn tỉnh/thành trước" : wards.length === 0 ? "Đang tải..." : "Chọn phường/xã"}
                    searchPlaceholder="Tìm phường/xã..."
                    emptyText="Không có phường/xã phù hợp"
                    disabled={!address.provinceCode || wards.length === 0}
                    className="border-slate-200 bg-slate-50/50 focus:ring-indigo-500/30"
                />
            </div>

            {/* Street */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Số nhà, tên đường
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <Input
                    value={address.street}
                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                    required={required}
                    placeholder="VD: 154 Tôn Đức Thắng..."
                />
            </div>
        </div>
    );
};
