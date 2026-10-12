import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/components/admin/LiveAdminPages";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});
