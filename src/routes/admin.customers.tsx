import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AdminCustomersPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/customers")({
  component: function AdminListRoute() {
    return useLocation({ select: (location) => location.pathname }) === "/admin/customers" ? (
      <AdminCustomersPage />
    ) : (
      <Outlet />
    );
  },
});
