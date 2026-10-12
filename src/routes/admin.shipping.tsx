import { createFileRoute } from "@tanstack/react-router";
import { AdminShippingPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/shipping")({
  component: AdminShippingPage,
});
