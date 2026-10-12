import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPaymentsPage } from "@/components/admin/LiveAdminPages";

const fetchRecords = vi.hoisted(() => vi.fn());
vi.mock("@/services/adminDataService", () => ({
  fetchAdminRecords: fetchRecords,
  fetchAdminSummary: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("Admin payment records", () => {
  it("renders real records returned by the service", async () => {
    fetchRecords.mockResolvedValue({
      rows: [
        {
          id: "payment-real",
          order_id: "ORDER-LIVE",
          amount: 999,
          status: "PAID",
          transaction_ref: "TXN-LIVE",
        },
      ],
      count: 1,
    });
    render(<AdminPaymentsPage />);
    expect(await screen.findByText("ORDER-LIVE")).toBeInTheDocument();
    expect(screen.getByText("TXN-LIVE")).toBeInTheDocument();
    expect(fetchRecords).toHaveBeenCalledWith({ table: "payments", sort: "updated_at" }, 0);
  });
  it("shows an empty state when the database has no payments", async () => {
    fetchRecords.mockResolvedValue({ rows: [], count: 0 });
    render(<AdminPaymentsPage />);
    expect(await screen.findByText("No records found.")).toBeInTheDocument();
    expect(screen.getByText("0 records")).toBeInTheDocument();
  });
  it("shows request failures without presenting them as empty data", async () => {
    fetchRecords.mockRejectedValue(new Error("Unable to load payments: permission denied"));
    render(<AdminPaymentsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("permission denied");
    expect(screen.queryByText("No records found.")).not.toBeInTheDocument();
  });
});
