import type { ReactNode } from "react";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HeaderUser } from "@/components/layout/header-user";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile, email, avatarUrl } = await requireProfile();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 sm:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="size-8 rounded-[8px]" />
            <Separator orientation="vertical" className="h-4" />
            <p className="hidden text-xs text-muted-foreground sm:block font-medium">
              Mohkam Society OS · PKR · {format(new Date(), "EEEE, d MMM yyyy")}
            </p>
          </div>

          <HeaderUser
            name={profile.full_name || email || "User"}
            email={email}
            roleLabel={ROLE_LABELS[profile.role]}
            avatarUrl={avatarUrl}
          />
        </header>
        <div className="flex-1 overflow-auto bg-background p-6 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
