import { createFileRoute } from "@tanstack/react-router";
import { AdminDiscountsPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/discounts")({
  component: AdminDiscountsPage,
});
