import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AdminOrdersPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/orders")({
  component: function AdminListRoute() {
    return useLocation({ select: (location) => location.pathname }) === "/admin/orders" ? (
      <AdminOrdersPage />
    ) : (
      <Outlet />
    );
  },
});
