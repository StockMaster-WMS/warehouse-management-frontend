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
    lengthCm: nonNegativeNumericString,
    widthCm: nonNegativeNumericString,
    heightCm: nonNegativeNumericString,
    weightKg: nonNegativeNumericString,
    minStock: nonNegativeNumericString,
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
    lengthCm: nonNegativeNumericString,
    widthCm: nonNegativeNumericString,
    heightCm: nonNegativeNumericString,
    weightKg: nonNegativeNumericString,
    minStock: nonNegativeNumericString,
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type EditProductFormValues = z.infer<typeof editProductSchema>;
