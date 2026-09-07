"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function entityHref(entityType: string | null, entityId: string | null): string | null {
  // Entities that have a list route but no per-id detail page fall back to the list.
  const listRoute: Record<string, string> = {
    installment: "/installments",
    cash_transaction: "/cash-book",
    cash: "/cash-book",
    society: "/societies",
    contract: "/development",
  };

  if (!entityId) {
    return entityType ? (listRoute[entityType] ?? null) : null;
  }

  switch (entityType) {
    case "customer":
      return `/customers/${entityId}`;
    case "property":
      return `/inventory/${entityId}`;
    case "lead":
      return `/leads/${entityId}`;
    case "document":
      return `/documents/${entityId}`;
    case "sale":
    case "booking":
      return `/bookings/${entityId}`;
    case "party":
      return `/parties/${entityId}`;
    case "receipt":
      return `/receipts/${entityId}`;
    case "land_parcel":
      return `/land-bank/${entityId}`;
    case "land_exchange":
      return `/land-bank/exchanges/${entityId}`;
    case "cash_transaction":
    case "cash":
      return `/cash-book/${entityId}`;
    case "staff":
      return `/staff/${entityId}`;
    case "agent":
      return `/agents/${entityId}`;
    case "society":
      return `/societies`;
    case "contract":
      return `/development`;
    case "installment":
      return "/installments";
    default:
      return null;
  }
}

function timeAgo(iso: string, _locale: string): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: enUS,
    });
  } catch {
    return "";
  }
}

export function NotificationBell({
  items,
  unread,
}: {
  items: Notification[];
  unread: number;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("notifications");
  const locale = useLocale();

  function handleRead(id: string, isRead: boolean) {
    if (isRead) return;
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("markedRead"));
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/80"
            title={t("title")}
          />
        }
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
        <span className="sr-only">{t("title")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-[10px] p-0 shadow-lg">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <Check className="size-3" />
              {t("markAllRead")}
            </button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("allCaughtUp")}
            </div>
          ) : (
            items.map((n) => {
              const href = entityHref(n.entity_type, n.entity_id);
              const body = (
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.is_read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug text-foreground">
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      {timeAgo(n.created_at, locale)}
                    </p>
                  </div>
                </div>
              );

              const rowClass = cn(
                "block w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                !n.is_read && "bg-primary/[0.03]",
              );

              return href ? (
                <Link
                  key={n.id}
                  href={href}
                  className={rowClass}
                  onClick={() => handleRead(n.id, n.is_read)}
                >
                  {body}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  className={rowClass}
                  onClick={() => handleRead(n.id, n.is_read)}
                >
                  {body}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
