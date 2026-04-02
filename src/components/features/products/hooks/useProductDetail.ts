import { useGetProductByIdQuery } from "@/store/services/product.service";

export function useProductDetail(productId: string) {
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetProductByIdQuery(productId);

  return {
    product: data?.data,
    error,
    isLoading,
    isFetching,
    refetch,
  };
}
