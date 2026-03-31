import React, { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';


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


export const AddressForm: React.FC<AddressFormProps> = ({ value, onChange, required }) => {
    const [provinces, setProvinces] = useState<{ label: string; value: string }[]>([]);
    const [wards, setWards] = useState<{ label: string; value: string }[]>([]);
    const [address, setAddress] = useState<AddressValue>(
        value || { street: '', provinceCode: '', provinceName: '', districtCode: '', districtName: '', wardCode: '', wardName: '' }
    );


    // Fetch provinces
    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/v2/p/')
            .then(res => res.json())
            .then((data) => {
                setProvinces(data.map((p: any) => ({ label: p.name, value: String(p.code) })));
            });
    }, []);


    // Fetch wards when province changes (API mới chỉ cho phép lấy wards theo province)
    useEffect(() => {
        if (address.provinceCode) {
            fetch(`https://provinces.open-api.vn/api/v2/w/?province=${address.provinceCode}`)
                .then(res => res.json())
                .then((data) => {
                    const wards = Array.isArray(data) ? data : [];
                    setWards(wards.map((w: any) => ({ label: w.name, value: String(w.code) })));
                });
        } else {
            setWards([]);
        }
        // Reset district và ward code, đồng thời cập nhật tên tỉnh
        const provinceName = getLabel(provinces, address.provinceCode);
        setAddress(a => ({ ...a, provinceName, districtCode: '', districtName: '', wardCode: '', wardName: '' }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address.provinceCode]);


    // Propagate changes
    useEffect(() => {
        onChange?.(address);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    // Helper to get label by value
    const getLabel = (list: { label: string; value: string }[], value: string) => {
        return list.find((item) => item.value === value)?.label || '';
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="font-medium">
                    Tỉnh/thành <span className="text-red-500">*</span>
                </label>
                <Select
                    value={address.provinceCode}
                    onValueChange={(val) => {
                        if (val) {
                            const provinceName = getLabel(provinces, val);
                            setAddress(a => ({ ...a, provinceCode: val, provinceName, districtCode: '', districtName: '', wardCode: '', wardName: '' }));
                        }
                    }}
                    required={required}
                    disabled={provinces.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn tỉnh/thành">
                            {getLabel(provinces, address.provinceCode)}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="font-medium">
                    Phường/xã <span className="text-red-500">*</span>
                </label>
                <Select
                    value={address.wardCode}
                    onValueChange={(val) => {
                        if (val) {
                            const wardName = getLabel(wards, val);
                            setAddress(a => ({ ...a, wardCode: val, wardName }));
                        }
                    }}
                    required={required}
                    disabled={!address.provinceCode || wards.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn phường/xã">
                            {getLabel(wards, address.wardCode)}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {wards.map((w) => (
                            <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="font-medium">
                    Số nhà, đường...{required && <span className="text-red-500">*</span>}
                </label>
                <Input
                    value={address.street}
                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                    required={required}
                    placeholder="Số nhà, đường..."
                />
            </div>
        </div>
    );
};
