import { createFileRoute } from "@tanstack/react-router";
import { AdminInventoryPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventoryPage,
});
