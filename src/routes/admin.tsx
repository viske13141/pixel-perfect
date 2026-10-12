import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboardPage } from "@/components/admin/LiveAdminPages";
import { RequireRole } from "@/components/auth/RequireRole";

function AdminRoute() {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <RequireRole role="ADMIN">
      <AdminLayout>{pathname === "/admin" ? <AdminDashboardPage /> : <Outlet />}</AdminLayout>
    </RequireRole>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});
