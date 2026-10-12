import { createFileRoute } from "@tanstack/react-router";
import { AdminSupportPage } from "@/components/admin/LiveAdminPages";

function AdminTicketRoute() {
  const { ticketId } = Route.useParams();
  return <AdminSupportPage ticketId={ticketId} />;
}

export const Route = createFileRoute("/admin/support/$ticketId")({
  component: AdminTicketRoute,
});
