"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserRoles } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
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
} from "./notification-utils";

type NotificationBellProps = {
  compact?: boolean;
};

function formatUnreadBadge(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: user } = useGetCurrentUserQuery();
  const canNavigateUser = getUserRoles(user?.roles).includes("ADMIN");
  const { data: countData } = useGetNotificationUnreadCountQuery(undefined, {
    pollingInterval: 45_000,
  });
  const {
    data: notificationsData,
    isLoading,
    isFetching,
  } = useGetNotificationsQuery(
    { page: 0, size: compact ? 5 : 8 },
    { pollingInterval: open ? 60_000 : 0, skip: !open },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  const unreadCount = countData?.data?.count ?? 0;
  const notifications = notificationsData?.data?.content ?? [];

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
    } catch {
      toast.error("Không thể đánh dấu tất cả thông báo.");
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full text-primary-foreground/85 hover:bg-white/10 hover:text-white"
            aria-label={
              unreadCount > 0
                ? `Thông báo, ${unreadCount} chưa đọc`
                : "Thông báo"
            }
          >
            <Bell className={compact ? "size-4" : "size-5"} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-primary">
                {formatUnreadBadge(unreadCount)}
              </span>
            ) : null}
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl p-0 shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="text-sm font-bold">
            Thông báo
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || markingAll}
            onClick={(event) => {
              event.preventDefault();
              void handleMarkAllRead();
            }}
            className="h-8 gap-1.5 px-2 text-xs"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </Button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Chưa có thông báo"
              description="Các cập nhật mới sẽ xuất hiện tại đây."
              className="py-10"
            />
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationMenuItem
                  key={notification.id}
                  notification={notification}
                  onOpen={() => void openNotification(notification)}
                />
              ))}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          render={<Link href="/notifications" />}
          className="justify-center rounded-none py-3 text-sm font-semibold text-primary"
        >
          Xem tất cả thông báo
          {isFetching ? (
            <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationMenuItem({
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
        "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !notification.read && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          severity.iconWrap,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {!notification.read ? (
            <span className={cn("h-2 w-2 rounded-full", severity.dot)} />
          ) : null}
          <span
            className={cn(
              "truncate text-sm font-semibold text-foreground",
              !notification.read && "font-bold",
            )}
          >
            {notification.title}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs font-medium text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <SeverityIcon className="h-3 w-3" />
          <span>{typeLabel}</span>
          <span>·</span>
          <span title={formatNotificationTime(notification.createdAt)}>
            {formatNotificationRelativeTime(notification.createdAt)}
          </span>
        </span>
      </span>
    </button>
  );
}
