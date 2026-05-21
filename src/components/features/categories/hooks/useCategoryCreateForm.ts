import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from "../schemas/categoryFormSchema";
import { useCreateCategoryMutation } from "@/store/services/category.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { apiErrMessage } from "@/types/api";

export function useCategoryCreateForm() {
  const {
    register,
    handleSubmit,
    control,
    formState,
    reset,
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      parentId: "",
      isActive: true,
    },
  });

  const [submitMessage, setSubmitMessage] = useState("");
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const categories = useMemo(
    () => categoryData?.data?.content ?? [],
    [categoryData],
  );

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories]
  );

  const watchedParentId = useWatch({ control, name: "parentId" }) ?? "";
  const watchedName = useWatch({ control, name: "name" }) ?? "";

  const parentCategory = watchedParentId
    ? categoriesById.get(watchedParentId) ?? null
    : null;

  const computedLevel = useMemo(() => {
    if (!parentCategory) return 0;
    return (parentCategory.level ?? 0) + 1;
  }, [parentCategory]);

  const isSaveDisabled = useMemo(
    () => isCreating || !watchedName.trim(),
    [isCreating, watchedName]
  );

  const onValid = async (formValues: CreateCategoryFormValues) => {
    setSubmitMessage("");

    try {
      await createCategory({
        name: formValues.name.trim(),
        parentId: formValues.parentId ? formValues.parentId : null,
        isActive: formValues.isActive,
      }).unwrap();

      setSubmitMessage("Tạo nhóm hàng thành công.");
      toast.success("Đã tạo nhóm hàng");
      reset();
    } catch (submitError) {
      const message = apiErrMessage(
        submitError,
        "Không thể tạo nhóm hàng. Vui lòng thử lại."
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
    categoryData,
    categories,
    isLoadingCategories,
    categoriesError: categoryError,
    refetchCategories,
    onValid,
    onInvalid,
    categoriesById,
    computedLevel,
    isSaveDisabled,
    isCreating,
  };
}
