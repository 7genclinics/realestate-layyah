"use client";

import Link from "next/link";
import { LogOut, Settings, ShieldCheck, User } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function HeaderUser({
  name,
  email,
  roleLabel,
  avatarUrl,
}: {
  name: string;
  email?: string;
  roleLabel: string;
  avatarUrl?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Profile Details Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex h-9 items-center gap-2.5 rounded-[8px] px-2 hover:bg-muted/80"
            />
          }
        >
          <Avatar className="size-8.5 rounded-full border border-border/80 ring-2 ring-primary/10 overflow-hidden shadow-2xs">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} className="object-cover size-full rounded-full" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary rounded-full">
              {initials(name) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-none text-foreground">{name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-[10px] p-1.5 shadow-lg">
          <DropdownMenuGroup>
            <div className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-[8px] mb-1">
              <Avatar className="size-10 rounded-full border border-border/80 ring-2 ring-primary/20 overflow-hidden shrink-0 shadow-2xs">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={name} className="object-cover size-full rounded-full" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary rounded-full">
                  {initials(name) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none truncate text-foreground">{name}</p>
                {email ? (
                  <p className="text-xs text-muted-foreground leading-none truncate mt-1">{email}</p>
                ) : null}
                <div className="pt-1.5">
                  <Badge variant="secondary" className="text-[10px] font-normal rounded-md px-1.5 py-0">
                    <ShieldCheck className="size-3 mr-1 text-primary" />
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              render={<Link href="/settings" />}
              className="cursor-pointer rounded-md text-xs py-2"
            >
              <Settings className="size-4 mr-2 text-muted-foreground" />
              Account Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md text-xs py-2"
            >
              <LogOut className="size-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Direct Quick Logout Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut()}
        title="Sign Out"
        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[8px]"
      >
        <LogOut className="size-4" />
        <span className="sr-only">Sign Out</span>
      </Button>
    </div>
  );
}
