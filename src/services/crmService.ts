import { getSupabase } from "@/lib/supabase";

export const stages = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;
export type Contact = {
  id: string;
  customer_id: string | null;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: (typeof stages)[number];
  value: number;
  follow_up_at: string | null;
  created_at: string;
};
export type ContactInput = Omit<Contact, "id" | "created_at">;
export type Note = { id: string; body: string; created_at: string };
export type CustomerMatch = { id: string; full_name: string; email: string; mobile: string | null };
export async function searchCustomers(name: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id,full_name,email,mobile")
    .eq("role", "CUSTOMER")
    .ilike("full_name", `%${name.trim()}%`)
    .order("full_name")
    .limit(20);
  if (error) throw new Error(`Unable to find customers: ${error.message}`);
  return data as CustomerMatch[];
}

export async function loadContacts() {
  // Retrieve all pages so search and dashboard totals include the whole CRM.
  const rows: Contact[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await getSupabase()
      .from("crm_contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new Error(`Unable to load CRM: ${error.message}`);
    rows.push(...(data as Contact[]));
    if (data.length < 500) return rows;
  }
}
export async function saveContact(id: string | null, input: ContactInput) {
  if (!input.name.trim()) throw new Error("Enter a contact name.");
  if (!Number.isFinite(input.value) || input.value < 0)
    throw new Error("Enter a valid opportunity value.");
  const table = getSupabase().from("crm_contacts");
  const { data, error } = await (id ? table.update(input).eq("id", id) : table.insert(input))
    .select()
    .single();
  if (error) throw new Error(`Unable to save contact: ${error.message}`);
  return data as Contact;
}
export async function loadNotes(id: string) {
  const { data, error } = await getSupabase()
    .from("crm_notes")
    .select("id,body,created_at")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load notes: ${error.message}`);
  return data as Note[];
}
export async function addNote(id: string, body: string) {
  if (!body.trim()) throw new Error("Enter a note.");
  const { data, error } = await getSupabase()
    .from("crm_notes")
    .insert({ contact_id: id, body: body.trim() })
    .select("id,body,created_at")
    .single();
  if (error) throw new Error(`Unable to save note: ${error.message}`);
  return data as Note;
}
