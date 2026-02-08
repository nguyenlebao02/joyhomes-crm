"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  CalendarDays,
  CheckSquare,
  Settings,
  Home,
  UserCircle,
} from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Tổng quan",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Home },
    ],
  },
  {
    title: "CRM",
    items: [
      { title: "Khách hàng", href: "/customers", icon: Users },
      { title: "Bảng hàng", href: "/inventory", icon: Building2 },
      { title: "Booking", href: "/bookings", icon: ShoppingCart },
    ],
  },
  {
    title: "Giao tiếp",
    items: [
      { title: "Tin nhắn", href: "/messages", icon: MessageSquare },
      { title: "Sự kiện", href: "/events", icon: CalendarDays },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { title: "Công việc", href: "/tasks", icon: CheckSquare },
      { title: "Báo cáo", href: "/reports", icon: BarChart3 },
    ],
  },
];

export function DashboardSidebarNavigation() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">
            Joyhomes CRM
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-sidebar-accent">
            <AvatarImage src="/avatar.svg" />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              <UserCircle className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Admin User</p>
            <p className="truncate text-xs text-sidebar-foreground/60">admin@joyhomes.vn</p>
          </div>
          <Link href="/settings">
            <Settings className="h-4 w-4 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
