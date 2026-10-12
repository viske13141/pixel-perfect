The admin CRM is available at `/admin/crm` under Customers > CRM.

Apply `supabase/migrations/202610120001_crm.sql` to the same Supabase database used by the app, after the existing auth and admin migrations. Use your normal Supabase migration process or run the file in the Supabase SQL editor.

Sign in with an ADMIN account. Add a contact, update its stage, schedule a follow-up, and record a note. Refresh to confirm persistence. CRM data is restricted to admins by database row-level security.

Existing registered customers and purchase history remain in Customers. Search by customer name in the contact form to link an existing customer and open their orders and addresses. Opportunity values are estimates, not recorded sales. Follow-ups appear in the CRM dashboard when due; email or SMS reminders are not sent.
