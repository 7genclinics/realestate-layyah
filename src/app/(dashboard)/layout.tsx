import type { ReactNode } from "react";

import { requireProfile } from "@/lib/auth";
import { getMyNotifications } from "@/lib/notifications";
import { ROLE_LABELS } from "@/lib/constants";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { HeaderUser } from "@/components/layout/header-user";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";


export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, email, avatarUrl } = await requireProfile();
  const { items: notifications, unread } = await getMyNotifications();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 sm:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="size-8 rounded-[8px]" />
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NotificationBell items={notifications} unread={unread} />
            <HeaderUser
              name={profile.full_name || email || "User"}
              email={email}
              roleLabel={ROLE_LABELS[profile.role]}
              avatarUrl={avatarUrl}
            />
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-background p-6 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
