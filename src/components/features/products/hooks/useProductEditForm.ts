import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  editProductSchema,
  type EditProductFormValues,
} from "../schemas/productFormSchema";
import {
  useUpdateProductMutation,
  useGetProductByIdQuery,
} from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { apiErrMessage } from "@/types/api";

export function useProductEditForm(productId: string) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState,
  } = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      barcode: "",
      name: "",
      category: "",
      baseUnit: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      weightKg: "",
      minStock: "",
      status: "ACTIVE",
    },
  });

  const [submitMessage, setSubmitMessage] = useState("");
  const { data, error, isLoading, isFetching, refetch } =
    useGetProductByIdQuery(productId);
  const [updateProduct] = useUpdateProductMutation();
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  useEffect(() => {
    if (!data?.data) return;
    const p = data.data;
    reset({
      barcode: p.barcodeEan13 ?? "",
      name: p.name ?? "",
      category: p.categoryId ?? "",
      baseUnit: p.baseUnit ?? "",
      lengthCm: p.lengthCm != null ? String(p.lengthCm) : "",
      widthCm: p.widthCm != null ? String(p.widthCm) : "",
      heightCm: p.heightCm != null ? String(p.heightCm) : "",
      weightKg: p.weightKg != null ? String(p.weightKg) : "",
      minStock: p.minStockQty != null ? String(p.minStockQty) : "",
      status: p.status ?? "ACTIVE",
    });
  }, [data, reset]);

  const onValid = async (formValues: EditProductFormValues) => {
    setSubmitMessage("");
    const current = data?.data;
    if (!current) return;

    try {
      await updateProduct({
        id: productId,
        sku: current.sku,
        barcodeEan13: formValues.barcode?.trim() || undefined,
        name: formValues.name.trim(),
        categoryId: formValues.category.trim(),
        baseUnit: formValues.baseUnit.trim(),
        weightKg: formValues.weightKg ? Number(formValues.weightKg) : null,
        lengthCm: formValues.lengthCm ? Number(formValues.lengthCm) : null,
        widthCm: formValues.widthCm ? Number(formValues.widthCm) : null,
        heightCm: formValues.heightCm ? Number(formValues.heightCm) : null,
        minStockQty: formValues.minStock ? Number(formValues.minStock) : null,
        status: formValues.status,
      }).unwrap();
      setSubmitMessage("Cập nhật sản phẩm thành công.");
      toast.success("Đã cập nhật sản phẩm");
    } catch (submitError) {
      const message = apiErrMessage(
        submitError,
        "Không thể cập nhật sản phẩm. Vui lòng thử lại."
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
    data,
    error,
    isLoading,
    isFetching,
    refetch,
    categoryData,
    isLoadingCategories,
    categoryError,
    refetchCategories,
    onValid,
    onInvalid,
  };
}
