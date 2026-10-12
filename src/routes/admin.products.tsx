import { createFileRoute } from "@tanstack/react-router";
import { AdminProductsPage } from "@/components/admin/AdminCommercePages";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});
