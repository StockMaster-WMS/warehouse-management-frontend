import { z } from "zod";

export const newOrderSchema = z.object({
  customerId: z.string().trim().min(1, "Chọn khách hàng"),
  customerName: z.string().trim().min(1, "Nhập hoặc chọn khách hàng"),
  street: z.string().trim().min(1, "Nhập địa chỉ giao hàng"),
  wardCode: z.string().trim().optional(),
  provinceCode: z.string().trim().optional(),
  country: z.string().trim().length(2, "Nhập mã quốc gia gồm 2 ký tự"),
  warehouseId: z.string().trim().min(1, "Chọn kho xuất"),
  priority: z
    .number()
    .int("Mức độ ưu tiên không hợp lệ")
    .min(1, "Mức độ ưu tiên không hợp lệ")
    .max(5, "Mức độ ưu tiên không hợp lệ"),
});

export type NewOrderValidationInput = z.input<typeof newOrderSchema>;
