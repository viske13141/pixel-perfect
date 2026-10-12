import { createFileRoute } from "@tanstack/react-router";
import { AdminContentPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/content")({
  component: AdminContentPage,
});
