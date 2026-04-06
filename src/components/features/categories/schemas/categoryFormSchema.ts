import { z } from "zod";

const categoryBaseSchema = z.object({
  name: z.string().trim().min(1, "Tên nhóm hàng là bắt buộc."),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

export const createCategorySchema = categoryBaseSchema;

export const editCategorySchema = categoryBaseSchema.extend({
  code: z.string().trim().min(1, "Mã nhóm hàng là bắt buộc."),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
export type EditCategoryFormValues = z.infer<typeof editCategorySchema>;
