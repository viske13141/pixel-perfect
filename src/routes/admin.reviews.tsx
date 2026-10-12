import { createFileRoute } from "@tanstack/react-router";
import { AdminReviewsPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviewsPage,
});
