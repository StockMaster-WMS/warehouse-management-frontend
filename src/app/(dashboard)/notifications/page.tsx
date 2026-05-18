"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserRoles } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/services/notification.service";
import type { AppNotification } from "@/types/notification";
import {
  formatNotificationTime,
  formatNotificationRelativeTime,
  getNotificationHref,
  NOTIFICATION_SEVERITY_ICON,
  NOTIFICATION_SEVERITY_STYLE,
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
} from "@/components/notifications/notification-utils";

type NotificationFilter = "all" | "unread";

const FILTERS: Array<{ value: NotificationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { data: user } = useGetCurrentUserQuery();
  const canNavigateUser = getUserRoles(user?.roles).includes("ADMIN");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const unreadOnly = filter === "unread";

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetNotificationsQuery(
    { page, size: pageSize, unreadOnly },
    { pollingInterval: 60_000 },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  const paged = data?.data;
  const rows = useMemo(() => paged?.content ?? [], [paged]);
  const totalElements = paged?.total_elements ?? 0;
  const totalPages = paged?.total_pages ?? 0;

  async function openNotification(notification: AppNotification) {
    try {
      if (!notification.read) {
        await markRead(notification.id).unwrap();
      }
      const href = getNotificationHref(notification, { canNavigateUser });
      if (href) {
        router.push(href);
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái thông báo.");
    }
  }

  async function handleMarkAllRead() {
    try {
      const result = await markAllRead().unwrap();
      toast.success(`Đã đánh dấu ${result.data.updated} thông báo là đã đọc`);
      refetch();
      setPage(0);
    } catch {
      toast.error("Không thể đánh dấu tất cả thông báo.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Theo dõi các cảnh báo, phân công và cập nhật hệ thống mới nhất."
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={markingAll || rows.length === 0}
            onClick={handleMarkAllRead}
            className="gap-2"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setFilter(item.value);
                  setPage(0);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === item.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>{totalElements.toLocaleString("vi-VN")} thông báo</span>
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`notification-loading-${index}`} className="flex gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Bell}
            title="Không tải được thông báo"
            description="Vui lòng thử lại sau ít phút."
            action={
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Tải lại
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Chưa có thông báo"
            description={
              unreadOnly
                ? "Không còn thông báo chưa đọc."
                : "Các thông báo mới sẽ xuất hiện tại đây."
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((notification) => (
              <NotificationCenterRow
                key={notification.id}
                notification={notification}
                onOpen={() => void openNotification(notification)}
              />
            ))}
          </div>
        )}

        <PaginationFooter
          itemLabel="thông báo"
          rowsCount={rows.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onPrevPage={() => setPage((value) => Math.max(0, value - 1))}
          onNextPage={() => setPage((value) => value + 1)}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
          }}
        />
      </section>
    </div>
  );
}

function NotificationCenterRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: () => void;
}) {
  const Icon = NOTIFICATION_TYPE_ICON[notification.type] ?? Bell;
  const SeverityIcon = NOTIFICATION_SEVERITY_ICON[notification.severity];
  const severity = NOTIFICATION_SEVERITY_STYLE[notification.severity];
  const typeLabel = NOTIFICATION_TYPE_LABEL[notification.type] ?? notification.type;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !notification.read && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          severity.iconWrap,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {!notification.read ? (
            <span className={cn("h-2.5 w-2.5 rounded-full", severity.dot)} />
          ) : null}
          <span
            className={cn(
              "text-sm font-semibold text-foreground",
              !notification.read && "font-bold",
            )}
          >
            {notification.title}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {typeLabel}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {severity.label}
          </span>
        </span>
        <span className="mt-1 block text-sm font-medium leading-relaxed text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-2 block text-xs font-medium text-muted-foreground">
          <span title={formatNotificationTime(notification.createdAt)}>
            <SeverityIcon className="mr-1 inline h-3.5 w-3.5" />
            {formatNotificationRelativeTime(notification.createdAt)}
          </span>
        </span>
      </span>
    </button>
  );
}
