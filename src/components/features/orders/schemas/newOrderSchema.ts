import { z } from "zod";

export const newOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Nhập hoặc chọn khách hàng"),
  street: z.string().trim().min(1, "Nhập địa chỉ giao hàng"),
  wardCode: z.string().trim().min(1, "Chọn phường/xã"),
  provinceCode: z.string().trim().min(1, "Chọn tỉnh/thành"),
  country: z.string().trim().length(2, "Nhập mã quốc gia gồm 2 ký tự"),
  warehouseId: z.string().trim().min(1, "Chọn kho xuất"),
  priority: z.number().int("Độ ưu tiên phải là số nguyên").min(1, "Độ ưu tiên phải là số nguyên >= 1"),
});

export type NewOrderValidationInput = z.input<typeof newOrderSchema>;
