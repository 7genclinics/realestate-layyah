"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  ChartColumn,
  ClipboardCheck,
  FileSignature,
  FileStack,
  Hammer,
  Handshake,
  History,
  IdCard,
  LandPlot,
  LayoutDashboard,
  Map,
  Receipt,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "land-plot": LandPlot,
  map: Map,
  target: Target,
  users: Users,
  "file-signature": FileSignature,
  "calendar-clock": CalendarClock,
  receipt: Receipt,
  "book-open": BookOpen,
  handshake: Handshake,
  hammer: Hammer,
  briefcase: Briefcase,
  "id-card": IdCard,
  "clipboard-check": ClipboardCheck,
  "file-stack": FileStack,
  "chart-column": ChartColumn,
  history: History,
  settings: Settings,
} as const;

export function AppSidebar() {
  const pathname = usePathname();
  const tBrand = useTranslations("brand");
  const tCommon = useTranslations("common");
  const liveItems = NAV_ITEMS.filter((item) => !("disabled" in item && item.disabled));
  const laterItems = NAV_ITEMS.filter((item) => "disabled" in item && item.disabled);

  return (
    <Sidebar collapsible="icon" className="border-e">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight">{tBrand("name")}</p>
            <p className="truncate text-xs text-muted-foreground">
              {tBrand("tagline")}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label={tCommon("operations")} items={liveItems} pathname={pathname} />
        {laterItems.length ? (
          <NavGroup label={tCommon("comingNext")} items={laterItems} pathname={pathname} />
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: (typeof NAV_ITEMS)[number][];
  pathname: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const disabled = "disabled" in item && Boolean((item as { disabled?: boolean }).disabled);
            const title = tNav(item.navKey);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  disabled={disabled}
                  tooltip={disabled ? tCommon("comingLater") : title}
                  className={
                    isActive
                      ? "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary rounded-[8px]"
                      : "rounded-[8px] hover:bg-muted/60"
                  }
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                  render={disabled ? undefined : <Link href={item.href} />}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
