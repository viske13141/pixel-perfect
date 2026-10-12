import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminCrmPage } from "@/components/admin/AdminCrmPage";
const mocks = vi.hoisted(() => ({
  loadContacts: vi.fn(),
  saveContact: vi.fn(),
  loadNotes: vi.fn(),
  addNote: vi.fn(),
}));
vi.mock("@/services/crmService", () => ({
  ...mocks,
  stages: ["New", "Contacted", "Qualified", "Won", "Lost"],
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
const lead = {
  id: "lead-1",
  name: "Priya",
  email: "priya@example.com",
  phone: "",
  source: "Instagram",
  stage: "New",
  value: 500,
  follow_up_at: "2020-01-01T10:00:00Z",
  customer_id: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.loadContacts.mockResolvedValue([lead]);
  mocks.loadNotes.mockResolvedValue([]);
});
afterEach(cleanup);

it("searches leads and saves an updated stage and a conversation note", async () => {
  mocks.saveContact.mockResolvedValue({ ...lead, stage: "Qualified" });
  mocks.addNote.mockResolvedValue({
    id: "note-1",
    body: "Requested a callback",
    created_at: "2026-10-12T10:00:00Z",
  });
  render(<AdminCrmPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Priya" }));
  await waitFor(() => expect(mocks.loadNotes).toHaveBeenCalledWith("lead-1"));
  fireEvent.change(screen.getByLabelText("Stage"), { target: { value: "Qualified" } });
  fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
  await waitFor(() =>
    expect(mocks.saveContact).toHaveBeenCalledWith(
      "lead-1",
      expect.objectContaining({ stage: "Qualified", value: 500 }),
    ),
  );
  await screen.findByText("Contact saved.");
  fireEvent.change(screen.getByLabelText("Conversation note"), {
    target: { value: "Requested a callback" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add note" }));
  expect(await screen.findByText("Requested a callback")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search contacts"), { target: { value: "unmatched" } });
  expect(screen.getByText("No contacts match these filters.")).toBeInTheDocument();
});

it("shows load failures with a retry action", async () => {
  mocks.loadContacts.mockRejectedValue(new Error("CRM database unavailable"));
  render(<AdminCrmPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("CRM database unavailable");
  expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
});
