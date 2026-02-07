import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebarNavigation } from "@/components/layouts/dashboard-sidebar-navigation";
import { DashboardHeaderTopbar } from "@/components/layouts/dashboard-header-topbar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebarNavigation />
      <SidebarInset>
        <DashboardHeaderTopbar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
