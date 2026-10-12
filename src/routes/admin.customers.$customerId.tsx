import { createFileRoute } from "@tanstack/react-router";
import { AdminCustomerDetailsPage } from "@/components/admin/LiveAdminPages";

function AdminCustomerRoute() {
  const { customerId } = Route.useParams();
  return <AdminCustomerDetailsPage customerId={customerId} />;
}

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: AdminCustomerRoute,
});
