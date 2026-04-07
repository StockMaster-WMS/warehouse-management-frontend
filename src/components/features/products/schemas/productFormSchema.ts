import { z } from "zod";

const nonNegativeNumericString = z
    .string()
    .optional()
    .refine((val) => !val || (!Number.isNaN(Number(val)) && Number(val) >= 0), {
        message: "Giá trị phải là số không âm.",
    });

export const createProductSchema = z.object({
    barcode: z
        .string()
        .regex(/^(\d{8,13})?$/, "Mã vạch phải có từ 8 đến 13 chữ số.")
        .optional()
        .or(z.literal("")),
    name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc."),
    category: z.string().min(1, "Vui lòng chọn nhóm hàng."),
    baseUnit: z.string().min(1, "Vui lòng chọn đơn vị tính."),
    weightKg: nonNegativeNumericString,
    volumeCm3: nonNegativeNumericString,
    minStock: nonNegativeNumericString,
    isLotTracked: z.boolean().optional(),
    isExpiryTracked: z.boolean().optional(),
    isFrozen: z.boolean().optional(),
    isFragile: z.boolean().optional(),
    isHazmat: z.boolean().optional(),
    isHeavy: z.boolean().optional(),
});

export const editProductSchema = z.object({
    barcode: z
        .string()
        .regex(/^(\d{8,13})?$/, "Mã vạch phải có từ 8 đến 13 chữ số.")
        .optional()
        .or(z.literal("")),
    name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc."),
    category: z.string().min(1, "Vui lòng chọn nhóm hàng."),
    baseUnit: z.string().trim().min(1, "Đơn vị tính là bắt buộc."),
    weightKg: nonNegativeNumericString,
    volumeCm3: nonNegativeNumericString,
    minStock: nonNegativeNumericString,
    isLotTracked: z.boolean().optional(),
    isExpiryTracked: z.boolean().optional(),
    isFrozen: z.boolean().optional(),
    isFragile: z.boolean().optional(),
    isHazmat: z.boolean().optional(),
    isHeavy: z.boolean().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type EditProductFormValues = z.infer<typeof editProductSchema>;
