import { createFileRoute } from "@tanstack/react-router";
import { AdminCrmPage } from "@/components/admin/AdminCrmPage";

export const Route = createFileRoute("/admin/crm")({ component: AdminCrmPage });
