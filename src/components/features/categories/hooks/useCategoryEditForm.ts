// Tạo slug từ tên tiếng Việt không dấu, giống backend

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  editCategorySchema,
  type EditCategoryFormValues,
} from "../schemas/categoryFormSchema";
import {
  useGetCategoryByIdQuery,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/store/services/category.service";
import { apiErrMessage } from "@/types/api";

export function useCategoryEditForm(categoryId: string) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState,
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      code: "",
      name: "",
      parentId: "",
      isActive: true,
    },
  });

  const [submitMessage, setSubmitMessage] = useState("");
  const { data, error, isLoading, refetch } = useGetCategoryByIdQuery(categoryId);
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  useEffect(() => {
    if (!data?.data) return;
    const c = data.data;
    reset({
      code: c.code ?? "",
      name: c.name ?? "",
      parentId: c.parentId ?? "",
      isActive: Boolean(c.isActive),
    });
  }, [data, reset]);

  const allCategories = useMemo(
    () => categoryData?.data?.content ?? [],
    [categoryData],
  );

  const categoriesById = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c] as const)),
    [allCategories]
  );

  const watchedCode = useWatch({ control, name: "code" }) ?? "";
  const watchedParentId = useWatch({ control, name: "parentId" }) ?? "";
  const watchedName = useWatch({ control, name: "name" }) ?? "";

  const codeUpper = useMemo(() => watchedCode.trim().toUpperCase(), [watchedCode]);

  const parentCategory = watchedParentId
    ? categoriesById.get(watchedParentId) ?? null
    : null;

  const computedLevel = useMemo(() => {
    if (!parentCategory) return 0;
    return (parentCategory.level ?? 0) + 1;
  }, [parentCategory]);

  const computedPath = useMemo(() => {
    const parentPath = parentCategory?.path ?? "";
    return parentPath;
  }, [parentCategory]);

  const descendantIds = useMemo(() => {
    if (!categoryId) return new Set<string>();

    const childrenByParentId = new Map<string, typeof allCategories>();
    allCategories.forEach((cat) => {
      const parentId = cat.parentId ?? "";
      const existing = childrenByParentId.get(parentId) ?? [];
      existing.push(cat);
      childrenByParentId.set(parentId, existing);
    });

    const result = new Set<string>();
    const stack: string[] = [categoryId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      const children = childrenByParentId.get(current) ?? [];
      for (const child of children) {
        if (child.id === categoryId) continue;
        if (result.has(child.id)) continue;
        result.add(child.id);
        stack.push(child.id);
      }
    }

    result.delete(categoryId);
    return result;
  }, [allCategories, categoryId]);

  const parentSelectExcludeIds = useMemo(() => {
    const set = new Set<string>([categoryId]);
    for (const id of descendantIds) {
      set.add(id);
    }
    return set;
  }, [categoryId, descendantIds]);

  const isSaveDisabled = useMemo(
    () => isUpdating || !watchedName.trim(),
    [isUpdating, watchedName]
  );

  const onValid = async (formData: EditCategoryFormValues) => {
    setSubmitMessage("");

    try {
      await updateCategory({
        id: categoryId,
        body: {
          code: codeUpper,
          name: formData.name.trim(),
          parentId: formData.parentId ? formData.parentId : null,
          path: computedPath,
          level: computedLevel,
          isActive: formData.isActive,
        },
      }).unwrap();

      setSubmitMessage("Cập nhật nhóm hàng thành công.");
      toast.success("Đã cập nhật nhóm hàng");
    } catch (submitError) {
      const message = apiErrMessage(
        submitError,
        "Không thể cập nhật nhóm hàng. Vui lòng thử lại."
      );
      setSubmitMessage(message);
      toast.error(message);
    }
  };

  const onInvalid = () => {
    toast.error("Kiểm tra lại thông tin đã nhập.");
  };

  return {
    register,
    handleSubmit,
    control,
    formState,
    submitMessage,
    onValid,
    onInvalid,
    data,
    error,
    isLoading,
    refetch,
    allCategories,
    categoriesById,
    isLoadingCategories,
    categoriesError: categoryError,
    refetchCategories,
    computedLevel,
    computedPath,
    parentSelectExcludeIds,
    isSaveDisabled,
    isUpdating,
  };
}
