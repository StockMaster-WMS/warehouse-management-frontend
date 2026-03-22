
import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { AxiosRequestConfig, AxiosError } from "axios";
import { axiosInstance } from "@/lib/axios-instance";

const axiosBaseQuery =
    (): BaseQueryFn<
        {
            url: string;
            method: AxiosRequestConfig["method"];
            data?: AxiosRequestConfig["data"];
            params?: AxiosRequestConfig["params"];
        },
        unknown,
        unknown
    > =>
        async ({ url, method, data, params }) => {
            try {
                const result = await axiosInstance({ url, method, data, params });
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
    tagTypes: ["Category", "Product", "Warehouse"],
    endpoints: () => ({}),
});
