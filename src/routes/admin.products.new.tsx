import { createFileRoute } from "@tanstack/react-router";
import { AdminProductFormPage } from "@/components/admin/AdminCommercePages";

function AdminProductNewRoute() {
  return <AdminProductFormPage />;
}

export const Route = createFileRoute("/admin/products/new")({
  component: AdminProductNewRoute,
});
