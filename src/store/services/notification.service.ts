import { baseApi } from "@/store/services/api";
import {
  normalizeApiResponsePaged,
  type ApiResponse,
  type PagedResponse,
} from "@/types/api";
import type {
  AppNotification,
  NotificationReadAllResult,
  NotificationUnreadCount,
} from "@/types/notification";

export type GetNotificationsParams = {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
};

const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<PagedResponse<AppNotification>>,
      GetNotificationsParams | void
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          unreadOnly: params?.unreadOnly || undefined,
        },
      }),
      transformResponse: (
        response: ApiResponse<AppNotification[] | PagedResponse<AppNotification>>,
      ) => normalizeApiResponsePaged(response),
      providesTags: (result) => [
        { type: "Notification" as const, id: "LIST" },
        ...(result?.data?.content ?? []).map((notification) => ({
          type: "Notification" as const,
          id: notification.id,
        })),
      ],
    }),

    getNotificationUnreadCount: builder.query<
      ApiResponse<NotificationUnreadCount>,
      void
    >({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
      }),
      providesTags: [{ type: "Notification" as const, id: "UNREAD_COUNT" }],
    }),

    markNotificationRead: builder.mutation<ApiResponse<AppNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification" as const, id },
        { type: "Notification" as const, id: "LIST" },
        { type: "Notification" as const, id: "UNREAD_COUNT" },
      ],
    }),

    markAllNotificationsRead: builder.mutation<
      ApiResponse<NotificationReadAllResult>,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification" as const, id: "LIST" },
        { type: "Notification" as const, id: "UNREAD_COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
