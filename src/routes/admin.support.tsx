import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AdminSupportPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/support")({
  component: function AdminListRoute() {
    return useLocation({ select: (location) => location.pathname }) === "/admin/support" ? (
      <AdminSupportPage />
    ) : (
      <Outlet />
    );
  },
});
