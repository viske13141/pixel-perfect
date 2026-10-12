import { createFileRoute } from "@tanstack/react-router";
import { AdminReturnsPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/returns")({
  component: AdminReturnsPage,
});
