import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    createProductSchema,
    type CreateProductFormValues,
} from "../schemas/productFormSchema";
import { useCreateProductMutation } from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { apiErrMessage } from "@/types/api";

export function useProductCreateForm() {
    const {
        register,
        handleSubmit,
        control,
        formState,
    } = useForm<CreateProductFormValues>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            barcode: "",
            name: "",
            category: "",
            baseUnit: "cai",
            lengthCm: "",
            widthCm: "",
            heightCm: "",
            weightKg: "",
            minStock: "5",
        },
    });

    const [submitMessage, setSubmitMessage] = useState("");
    const [createProduct] = useCreateProductMutation();
    const {
        data: categoryData,
        isLoading: isLoadingCategories,
        error: categoryError,
        refetch: refetchCategories,
    } = useGetCategoriesQuery();

    const onValid = async (formValues: CreateProductFormValues) => {
        setSubmitMessage("");
        try {
            await createProduct({
                barcodeEan13: formValues.barcode?.trim() || "",
                name: formValues.name.trim(),
                categoryId: formValues.category.trim(),
                primarySupplierId: null,
                baseUnit: formValues.baseUnit.trim(),
                weightKg: formValues.weightKg ? Number(formValues.weightKg) : 0,
                lengthCm: formValues.lengthCm ? Number(formValues.lengthCm) : 0,
                widthCm: formValues.widthCm ? Number(formValues.widthCm) : 0,
                heightCm: formValues.heightCm ? Number(formValues.heightCm) : 0,
            }).unwrap();
            setSubmitMessage("Tạo sản phẩm thành công.");
            toast.success("Đã tạo sản phẩm mới");
        } catch (submitError) {
            const message = apiErrMessage(submitError, "Không thể tạo sản phẩm. Vui lòng thử lại.");
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
        isLoadingCategories,
        categoryError,
        refetchCategories,
        onValid,
        onInvalid,
    };
}
