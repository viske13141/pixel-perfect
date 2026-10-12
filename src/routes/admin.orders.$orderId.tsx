import { createFileRoute } from "@tanstack/react-router";
import { AdminOrderDetailsPage } from "@/components/admin/LiveAdminPages";

function AdminOrderRoute() {
  const { orderId } = Route.useParams();
  return <AdminOrderDetailsPage orderId={orderId} />;
}

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderRoute,
});
