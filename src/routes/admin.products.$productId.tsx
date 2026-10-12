import { createFileRoute } from "@tanstack/react-router";
import { AdminProductFormPage } from "@/components/admin/AdminCommercePages";

function AdminProductEditRoute() {
  const { productId } = Route.useParams();
  return <AdminProductFormPage productId={productId} />;
}

export const Route = createFileRoute("/admin/products/$productId")({
  component: AdminProductEditRoute,
});
