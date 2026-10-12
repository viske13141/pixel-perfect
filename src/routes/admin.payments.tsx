import { createFileRoute } from "@tanstack/react-router";
import { AdminPaymentsPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
});
