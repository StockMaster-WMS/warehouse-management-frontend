import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    createProductSchema,
    type CreateProductFormValues,
} from "../schemas/productFormSchema";
import { useCreateProductMutation } from "@/store/services/product.service";
import { useGetCategoriesQuery } from "@/store/services/category.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import { apiErrMessage } from "@/types/api";

export function useProductCreateForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        formState,
        setValue,
    } = useForm<CreateProductFormValues>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            barcode: "",
            name: "",
            category: "",
            baseUnit: "PCS",
            weightKg: "0.1",
            volumeCm3: "",
            minStock: "5",
            isLotTracked: false,
            isExpiryTracked: false,
            isFrozen: false,
            isFragile: false,
            isHazmat: false,
            isHeavy: false,
            supplierId: "",
            createdBy: "",
        },
    });

    const { data: currentUser } = useGetCurrentUserQuery();

    // Cập nhật createdBy với ID (UUID) của người dùng hiện tại
    useEffect(() => {
        if (currentUser?.id) {
            setValue("createdBy", currentUser.id);
        }
    }, [currentUser, setValue]);

    const [submitMessage, setSubmitMessage] = useState("");
    const [createProduct] = useCreateProductMutation();
    const {
        data: categoryData,
        isLoading: isLoadingCategories,
        error: categoryError,
        refetch: refetchCategories,
    } = useGetCategoriesQuery();

    const {
        data: supplierData,
        isLoading: isLoadingSuppliers,
    } = useGetSuppliersQuery({ size: 100 });

    const onValid = async (formValues: CreateProductFormValues) => {
        setSubmitMessage("");
        try {
            await createProduct({
                barcodeEan13: formValues.barcode?.trim() || undefined,
                name: formValues.name.trim(),
                categoryId: formValues.category.trim(),
                primarySupplierId: formValues.supplierId?.trim() || null,
                baseUnit: formValues.baseUnit.trim(),
                weightKg: formValues.weightKg ? Number(formValues.weightKg) : null,
                volumeCm3: formValues.volumeCm3 ? Number(formValues.volumeCm3) : null,
                minStockQty: formValues.minStock ? Number(formValues.minStock) : 0,
                isLotTracked: Boolean(formValues.isLotTracked),
                isExpiryTracked: Boolean(formValues.isExpiryTracked),
                isFrozen: Boolean(formValues.isFrozen),
                isFragile: Boolean(formValues.isFragile),
                isHazmat: Boolean(formValues.isHazmat),
                isHeavy: Boolean(formValues.isHeavy),
                createdBy: formValues.createdBy,
            }).unwrap();
            
            toast.success("Đã tạo sản phẩm mới thành công!");
            
            // Chuyển về trang danh sách sau 1.5s để người dùng kịp đọc thông báo
            setTimeout(() => {
                router.push("/products");
            }, 1500);
            
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
        supplierData,
        isLoadingSuppliers,
    };
}
