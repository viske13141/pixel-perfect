import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AdminButton, AdminMetric, AdminPageHeader, AdminSection } from "./AdminLayout";
import {
  addNote,
  loadContacts,
  loadNotes,
  saveContact,
  searchCustomers,
  type CustomerMatch,
  stages,
  type Contact,
  type Note,
} from "@/services/crmService";

const inputClass = "mt-1 min-h-11 w-full border border-border bg-background px-3 py-2 text-sm";
const blank = {
  name: "",
  email: "",
  phone: "",
  source: "Manual",
  stage: "New" as Contact["stage"],
  value: "0",
  follow_up_at: "",
  customer_id: "",
};
function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export function AdminCrmPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All");
  const [dueOnly, setDueOnly] = useState(false);
  const dragContact = useRef<Contact | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const selectedId = selected?.id;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [body, setBody] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [customerError, setCustomerError] = useState("");
  const [formError, setFormError] = useState("");
  useEffect(() => {
    let active = true;
    setMatches([]);
    setCustomerError("");
    if (customerSearch.trim().length < 2) return;
    const timer = setTimeout(() => {
      searchCustomers(customerSearch)
        .then((data) => {
          if (active) setMatches(data);
        })
        .catch((reason) => {
          if (active) setCustomerError(message(reason));
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerSearch]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loadContacts()
      .then((data) => {
        if (active) setContacts(data);
      })
      .catch((reason) => {
        if (active) setError(message(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  useEffect(() => {
    let active = true;
    setNotes([]);
    setBody("");
    setNoteError("");
    if (selectedId) {
      setNotesLoading(true);
      loadNotes(selectedId)
        .then((data) => {
          if (active) setNotes(data);
        })
        .catch((reason) => {
          if (active) setNoteError(message(reason));
        })
        .finally(() => {
          if (active) setNotesLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedId]);
  const open = (contact: Contact | null) => {
    setSelected(contact);
    setEditing(true);
    setNotice("");
    setFormError("");
    setCustomerSearch("");
    setMatches([]);
    setForm(
      contact
        ? {
            ...contact,
            customer_id: contact.customer_id ?? "",
            value: String(contact.value),
            follow_up_at: localDate(contact.follow_up_at),
          }
        : blank,
    );
  };
  const due = (contact: Contact) =>
    !["Won", "Lost"].includes(contact.stage) &&
    !!contact.follow_up_at &&
    new Date(contact.follow_up_at).getTime() <= Date.now();
  const moveStage = async (contact: Contact, newStage: Contact["stage"]) => {
    if (contact.stage === newStage) return;
    const updated = { ...contact, stage: newStage };
    setContacts((rows) => rows.map((c) => (c.id === contact.id ? updated : c)));
    try {
      const { id, ...input } = updated;
      await saveContact(id, input);
    } catch {
      setContacts((rows) => rows.map((c) => (c.id === contact.id ? contact : c)));
    }
  };
  const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
  const toMs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;
  const inDateRange = (contact: Contact) => {
    const t = new Date(contact.created_at).getTime();
    return (fromMs === null || t >= fromMs) && (toMs === null || t <= toMs);
  };
  const filtered = contacts.filter(
    (contact) =>
      (stage === "All" || contact.stage === stage) &&
      (!dueOnly || due(contact)) &&
      inDateRange(contact) &&
      [contact.name, contact.email, contact.phone, contact.source].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const field = (key: keyof typeof blank, label: string, type = "text") => (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        className={inputClass}
        type={type}
        required={key === "name"}
        maxLength={key === "name" ? 200 : undefined}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={form[key]}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      />
    </label>
  );
  return (
    <>
      <AdminPageHeader
        title="CRM"
        subtitle="Manage leads, customer relationships, and your next follow-up."
        action={
          <AdminButton disabled={busy || loading} onClick={() => open(null)}>
            Add contact
          </AdminButton>
        }
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link className="text-sm text-primary underline" to="/admin/customers">
          Customer directory and purchase history
        </Link>
      </div>
      {notice && (
        <p role="status" className="mb-4 text-sm text-primary">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetric label="Contacts" value={contacts.length} />
          <AdminMetric
            label="Open leads"
            value={contacts.filter((c) => !["Won", "Lost"].includes(c.stage)).length}
          />
          <AdminMetric label="Follow-ups due" value={contacts.filter(due).length} />
          <AdminMetric
            label="Open pipeline"
            value={currency(
              contacts
                .filter((c) => !["Won", "Lost"].includes(c.stage))
                .reduce((sum, c) => sum + Number(c.value), 0),
            )}
          />
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <AdminButton variant={view === "table" ? "gold" : "quiet"} onClick={() => setView("table")}>Table</AdminButton>
        <AdminButton variant={view === "board" ? "gold" : "quiet"} onClick={() => setView("board")}>Board</AdminButton>
      </div>
      {view === "board" && !loading && !error && (
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-4" style={{ minWidth: `${stages.length * 220}px` }}>
            {stages.map((col) => {
              const colContacts = contacts
                .filter(
                  (c) =>
                    c.stage === col &&
                    (!dueOnly || due(c)) &&
                    inDateRange(c) &&
                    [c.name, c.email, c.phone, c.source].some((v) =>
                      v.toLowerCase().includes(search.toLowerCase()),
                    ),
                )
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              // group by date label
              const groups: { label: string; items: Contact[] }[] = [];
              for (const c of colContacts) {
                const d = new Date(c.created_at);
                const today = new Date();
                const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
                const label = d.toDateString() === today.toDateString() ? "Today"
                  : d.toDateString() === yesterday.toDateString() ? "Yesterday"
                  : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                const last = groups[groups.length - 1];
                if (last && last.label === label) last.items.push(c);
                else groups.push({ label, items: [c] });
              }
              return (
                <div
                  key={col}
                  className="flex w-52 shrink-0 flex-col border border-border bg-card/35"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragContact.current) moveStage(dragContact.current, col);
                    dragContact.current = null;
                  }}
                >
                  <div className="border-b border-border px-3 py-2">
                    <span className="eyebrow text-[0.58rem]">{col}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{colContacts.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {groups.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">No contacts</p>
                    )}
                    {groups.map((group) => (
                      <div key={group.label}>
                        <p className="mb-1 mt-2 px-1 text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                          {group.label}
                        </p>
                        {group.items.map((contact) => (
                          <div
                            key={contact.id}
                            draggable
                            onDragStart={() => { dragContact.current = contact; }}
                            className="mb-2 cursor-grab border border-border bg-background p-3 text-xs active:cursor-grabbing"
                          >
                            <button
                              className="mb-1 text-left text-sm text-primary underline"
                              onClick={() => open(contact)}
                            >
                              {contact.name}
                            </button>
                            <p className="text-muted-foreground">{contact.email || contact.phone || contact.source}</p>
                            {contact.value > 0 && (
                              <p className="mt-1">{currency(Number(contact.value))}</p>
                            )}
                            {due(contact) && (
                              <p className="mt-1 text-amber-300">Follow-up due</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className={view === "board" ? "hidden" : "grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]"} aria-hidden={view === "board"}>
        <AdminSection
          title="Contacts and leads"
          action={
            <AdminButton
              variant="quiet"
              disabled={loading || busy}
              onClick={() => setVersion((v) => v + 1)}
            >
              Refresh
            </AdminButton>
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              aria-label="Search contacts"
              placeholder="Search name, email, phone…"
              className={`${inputClass} flex-1`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter by stage"
              className={`${inputClass} sm:w-auto`}
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option>All</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              From
              <input
                type="date"
                aria-label="Created from"
                className={`${inputClass} w-auto`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              To
              <input
                type="date"
                aria-label="Created to"
                className={`${inputClass} w-auto`}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={dueOnly}
                onChange={(e) => setDueOnly(e.target.checked)}
              />
              Follow-ups due
            </label>
          </div>
          {loading ? (
            <p role="status">Loading CRM…</p>
          ) : error ? (
            <p className="text-sm text-muted-foreground">Use Refresh to retry loading your CRM.</p>
          ) : !filtered.length ? (
            <p className="py-6 text-sm text-muted-foreground">
              {contacts.length
                ? "No contacts match these filters."
                : "No contacts yet. Add your first lead to get started."}
            </p>
          ) : (
            <div className="max-h-[650px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {["Contact", "Stage", "Value", "Follow-up"].map((label) => (
                      <th className="border-b border-border p-3 text-xs" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr
                      key={contact.id}
                      className={selected?.id === contact.id ? "bg-primary/10" : ""}
                    >
                      <td className="border-b border-border p-3">
                        <button
                          disabled={busy}
                          className="text-left text-primary underline"
                          onClick={() => open(contact)}
                        >
                          {contact.name}
                        </button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {contact.email || contact.phone || contact.source}
                        </p>
                      </td>
                      <td className="border-b border-border p-3">{contact.stage}</td>
                      <td className="border-b border-border p-3 whitespace-nowrap">
                        {currency(Number(contact.value))}
                      </td>
                      <td
                        className={`border-b border-border p-3 text-xs ${due(contact) ? "text-amber-300" : ""}`}
                      >
                        {contact.follow_up_at
                          ? new Date(contact.follow_up_at).toLocaleString("en-IN")
                          : "Not scheduled"}
                        {due(contact) && <span className="block">Due</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
        {editing ? (
          <div className="space-y-6">
            <AdminSection title={selected ? "Edit contact" : "New contact"}>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setNotice("");
                  setFormError("");
                  try {
                    const saved = await saveContact(selected?.id ?? null, {
                      ...form,
                      name: form.name.trim(),
                      value: Number(form.value),
                      customer_id: form.customer_id.trim() || null,
                      follow_up_at: form.follow_up_at
                        ? new Date(form.follow_up_at).toISOString()
                        : null,
                    });
                    setContacts((rows) => [saved, ...rows.filter((c) => c.id !== saved.id)]);
                    setSelected(saved);
                    setNotice("Contact saved.");
                  } catch (reason) {
                    setFormError(message(reason));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <fieldset disabled={busy} className="space-y-4">
                  {formError && (
                    <p role="alert" className="text-sm text-red-300">
                      {formError}
                    </p>
                  )}
                  {field("name", "Name")}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("email", "Email", "email")}
                    {field("phone", "Phone", "tel")}
                  </div>
                  {field("source", "Source (e.g. Instagram, website, referral)")}
                  <label className="block text-xs text-muted-foreground">
                    Stage
                    <select
                      className={inputClass}
                      value={form.stage}
                      onChange={(e) =>
                        setForm({ ...form, stage: e.target.value as Contact["stage"] })
                      }
                    >
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  {field("value", "Opportunity value (INR)", "number")}
                  {field("follow_up_at", "Next follow-up (your local time)", "datetime-local")}
                  <label className="block text-xs text-muted-foreground">
                    Link an existing customer (optional)
                    <input
                      className={inputClass}
                      placeholder="Search customer name (at least 2 letters)"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </label>
                  {customerError && (
                    <p role="alert" className="text-sm text-red-300">
                      {customerError}
                    </p>
                  )}
                  {matches.length > 0 && (
                    <ul className="max-h-48 overflow-auto border border-border">
                      {matches.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            className="w-full p-3 text-left text-sm hover:bg-primary/10"
                            onClick={() => {
                              setForm({
                                ...form,
                                customer_id: customer.id,
                                name: form.name || customer.full_name,
                                email: form.email || customer.email,
                                phone: form.phone || customer.mobile || "",
                              });
                              setCustomerSearch("");
                              setMatches([]);
                            }}
                          >
                            {customer.full_name}
                            <span className="block text-xs text-muted-foreground">
                              {customer.email}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {form.customer_id && (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span>Customer linked</span>
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => setForm({ ...form, customer_id: "" })}
                      >
                        Unlink
                      </button>
                    </div>
                  )}
                  {form.customer_id && (
                    <Link
                      to="/admin/customers/$customerId"
                      params={{ customerId: form.customer_id }}
                      className="block text-sm text-primary underline"
                    >
                      View customer orders and addresses
                    </Link>
                  )}
                  <div className="flex gap-3">
                    <AdminButton type="submit">{busy ? "Saving…" : "Save contact"}</AdminButton>
                    <AdminButton
                      type="button"
                      variant="quiet"
                      onClick={() => {
                        setEditing(false);
                        setSelected(null);
                      }}
                    >
                      Close
                    </AdminButton>
                  </div>
                </fieldset>
              </form>
            </AdminSection>
            {selected && (
              <AdminSection title="Notes and conversations">
                {noteError && (
                  <p role="alert" className="mb-3 text-sm text-red-300">
                    {noteError}
                  </p>
                )}
                <form
                  className="mb-5 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setNoteError("");
                    try {
                      const note = await addNote(selected.id, body);
                      setNotes((rows) => [note, ...rows]);
                      setBody("");
                    } catch (reason) {
                      setNoteError(message(reason));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label className="text-xs">
                    Conversation note
                    <textarea
                      required
                      maxLength={10000}
                      className={`${inputClass} min-h-24`}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <AdminButton disabled={busy || notesLoading || !body.trim()} type="submit">
                    Add note
                  </AdminButton>
                </form>
                {notesLoading ? (
                  <p role="status">Loading notes…</p>
                ) : !notes.length ? (
                  <p className="text-sm text-muted-foreground">No conversations recorded yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {notes.map((note) => (
                      <li className="border-t border-border pt-4" key={note.id}>
                        <p className="whitespace-pre-wrap break-words text-sm">{note.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleString("en-IN")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminSection>
            )}
          </div>
        ) : (
          <AdminSection title="Build customer relationships">
            <p className="text-sm text-muted-foreground">
              Select a contact to update their stage, schedule a follow-up, or record a
              conversation. Add a contact to start tracking a new enquiry.
            </p>
          </AdminSection>
        )}
      </div>
    </>
  );
}

