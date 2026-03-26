import { createApi } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { axiosInstance } from "@/lib/axios-instance";

export type ApiQueryArgs = {
    url: string;
    method: AxiosRequestConfig["method"];
    data?: AxiosRequestConfig["data"];
    params?: AxiosRequestConfig["params"];
    timeout?: number;
};

export type ApiQueryError = {
    status: number | undefined;
    data: unknown;
};

const axiosBaseQuery =
    (): BaseQueryFn<ApiQueryArgs, unknown, ApiQueryError> =>
        async ({ url, method, data, params, timeout }, api) => {
            try {
                const result = await axiosInstance({
                    url,
                    method,
                    data,
                    params,
                    timeout,
                    signal: api.signal,
                });
                return { data: result.data };
            } catch (axiosError) {
                const err = axiosError as AxiosError;
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: axiosBaseQuery(),
    tagTypes: [
        "Category",
        "Product",
        "Warehouse",
        "Supplier",
        "Customer",
        "PurchaseOrder",
        "PoItem",
        "PutawayTask",
        "InboundReceipt",
        "SalesOrder",
        "SoItem",
        "PickingItem",
    ],
    endpoints: () => ({}),
});
