-- =============================================================================
-- Full feature schema — wiring fixes + net-new modules
-- Run ONCE in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run).
-- Every statement is idempotent and safe to re-run.
--
-- Sections:
--   1. Missing foreign keys (fixes silently-empty Agents / Staff / Development pages)
--   2. Receipts → cash-book posting column
--   3. Installment reschedule / waive support
--   4. Approval-workflow columns + cash-status enum values
--   5. document_entity enum: staff + agent
--   6. Net-new tables (audit_log, activities, leads, contractor depth, notifications)
--   7. Row-level security for the new tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) MISSING FOREIGN KEYS
--    These tables were created without FKs, so PostgREST embedded selects
--    (agents→commissions/payouts, staff→advances, development→…) error out and
--    the list pages silently render empty. Adding the FKs makes the embeds work.
--    Wrapped in guards so re-running is safe. If any ADD fails on orphan rows,
--    clean the orphaned rows and re-run just that block.
-- ---------------------------------------------------------------------------
do $$
begin
  -- agent_commissions
  if not exists (select 1 from pg_constraint where conname = 'agent_commissions_agent_id_fkey') then
    alter table public.agent_commissions
      add constraint agent_commissions_agent_id_fkey
      foreign key (agent_id) references public.agents(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agent_commissions_sale_id_fkey') then
    alter table public.agent_commissions
      add constraint agent_commissions_sale_id_fkey
      foreign key (sale_id) references public.sales(id) on delete cascade;
  end if;

  -- agent_payouts
  if not exists (select 1 from pg_constraint where conname = 'agent_payouts_agent_id_fkey') then
    alter table public.agent_payouts
      add constraint agent_payouts_agent_id_fkey
      foreign key (agent_id) references public.agents(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agent_payouts_commission_id_fkey') then
    alter table public.agent_payouts
      add constraint agent_payouts_commission_id_fkey
      foreign key (commission_id) references public.agent_commissions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agent_payouts_cash_account_id_fkey') then
    alter table public.agent_payouts
      add constraint agent_payouts_cash_account_id_fkey
      foreign key (cash_account_id) references public.cash_accounts(id);
  end if;

  -- development_projects
  if not exists (select 1 from pg_constraint where conname = 'development_projects_society_id_fkey') then
    alter table public.development_projects
      add constraint development_projects_society_id_fkey
      foreign key (society_id) references public.societies(id) on delete cascade;
  end if;

  -- development_expenses
  if not exists (select 1 from pg_constraint where conname = 'development_expenses_project_id_fkey') then
    alter table public.development_expenses
      add constraint development_expenses_project_id_fkey
      foreign key (project_id) references public.development_projects(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'development_expenses_party_id_fkey') then
    alter table public.development_expenses
      add constraint development_expenses_party_id_fkey
      foreign key (party_id) references public.parties(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'development_expenses_contract_id_fkey') then
    alter table public.development_expenses
      add constraint development_expenses_contract_id_fkey
      foreign key (contract_id) references public.contracts(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'development_expenses_cash_account_id_fkey') then
    alter table public.development_expenses
      add constraint development_expenses_cash_account_id_fkey
      foreign key (cash_account_id) references public.cash_accounts(id);
  end if;

  -- payroll_records
  if not exists (select 1 from pg_constraint where conname = 'payroll_records_staff_id_fkey') then
    alter table public.payroll_records
      add constraint payroll_records_staff_id_fkey
      foreign key (staff_id) references public.staff_members(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payroll_records_cash_account_id_fkey') then
    alter table public.payroll_records
      add constraint payroll_records_cash_account_id_fkey
      foreign key (cash_account_id) references public.cash_accounts(id);
  end if;

  -- salary_advances
  if not exists (select 1 from pg_constraint where conname = 'salary_advances_staff_id_fkey') then
    alter table public.salary_advances
      add constraint salary_advances_staff_id_fkey
      foreign key (staff_id) references public.staff_members(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'salary_advances_cash_account_id_fkey') then
    alter table public.salary_advances
      add constraint salary_advances_cash_account_id_fkey
      foreign key (cash_account_id) references public.cash_accounts(id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) RECEIPTS → CASH BOOK
--    Lets a customer receipt record which cash/bank account the money landed in
--    so receivePayment can post a matching cash_transaction.
-- ---------------------------------------------------------------------------
alter table public.receipts
  add column if not exists cash_account_id uuid references public.cash_accounts(id);

-- ---------------------------------------------------------------------------
-- 3) INSTALLMENT RESCHEDULE / WAIVE
--    Status is derived at read-time; these let an explicit override persist.
-- ---------------------------------------------------------------------------
alter table public.installments
  add column if not exists status_override text,   -- 'waived' | 'rescheduled' | null
  add column if not exists waived_reason text,
  add column if not exists reschedule_note text;

-- ---------------------------------------------------------------------------
-- 4) APPROVAL WORKFLOW
--    New cash-status values + approver stamps on money-moving records.
--    NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
--    The Supabase SQL editor auto-commits each statement, so this is fine.
-- ---------------------------------------------------------------------------
alter type public.cash_transaction_status add value if not exists 'pending_approval';
alter type public.cash_transaction_status add value if not exists 'rejected';

alter table public.cash_transactions
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz;

alter table public.development_expenses
  add column if not exists status text not null default 'approved',
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz;

alter table public.agent_commissions
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz;

-- ---------------------------------------------------------------------------
-- 5) DOCUMENT ENTITY ENUM: staff + agent (so KYC / agreements attach)
-- ---------------------------------------------------------------------------
alter type public.document_entity add value if not exists 'staff';
alter type public.document_entity add value if not exists 'agent';

-- ---------------------------------------------------------------------------
-- 5b) SYSTEM SETTINGS — unique key so upsert(onConflict:'key') actually updates
--     Old code upserted without a conflict target, so each save INSERTed a new
--     row (id has a default) and settings never persisted. Dedupe existing rows,
--     then enforce one row per key.
-- ---------------------------------------------------------------------------
delete from public.system_settings a
using public.system_settings b
where a.key = b.key and a.updated_at < b.updated_at;

delete from public.system_settings a
using public.system_settings b
where a.key = b.key and a.updated_at = b.updated_at and a.id > b.id;

create unique index if not exists system_settings_key_uidx
  on public.system_settings (key);

-- ---------------------------------------------------------------------------
-- 6) NET-NEW TABLES
-- ---------------------------------------------------------------------------

-- 6a) System audit log — one row per important change
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,          -- create | update | delete | approve | reject | status_change | payment
  entity_type text not null,     -- customer | property | receipt | cash_transaction | …
  entity_id uuid,
  summary text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- 6b) CRM activity timeline (leads + customers)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,     -- customer | lead
  entity_id uuid not null,
  activity_type text not null,   -- note | call | visit | whatsapp | email | status_change
  subject text,
  body text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists activities_entity_idx on public.activities (entity_type, entity_id, created_at desc);

-- 6c) Leads pipeline
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  code text,
  full_name text not null,
  phone text,
  source public.customer_source not null default 'walk_in',
  status text not null default 'new',  -- new | contacted | interested | negotiation | won | lost
  assigned_to uuid references public.profiles(id),
  agent_id uuid references public.agents(id) on delete set null,
  society_id uuid references public.societies(id) on delete set null,
  interest text,
  budget numeric,
  notes text,
  converted_customer_id uuid references public.customers(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status);

-- 6d) Contractor measurement book
create table if not exists public.measurement_entries (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  entry_date date not null default current_date,
  description text not null,
  unit public.contract_unit not null default 'other',
  quantity numeric not null default 0,
  rate numeric not null default 0,
  amount numeric not null default 0,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists measurement_entries_contract_idx on public.measurement_entries (contract_id);

-- 6e) Contractor / supplier material line items
create table if not exists public.material_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  name text not null,
  unit text,
  quantity_ordered numeric not null default 0,
  quantity_received numeric not null default 0,
  rate numeric not null default 0,
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists material_items_contract_idx on public.material_items (contract_id);

-- 6f) Contractor bills (submit → approve → pay)
create table if not exists public.contractor_bills (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  party_id uuid references public.parties(id) on delete set null,
  code text,
  bill_date date not null default current_date,
  gross_amount numeric not null default 0,
  deductions numeric not null default 0,
  retention numeric not null default 0,
  net_amount numeric not null default 0,
  status text not null default 'submitted',  -- submitted | approved | rejected | paid
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists contractor_bills_contract_idx on public.contractor_bills (contract_id);

-- 6g) Notifications / alerts
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  role_target public.app_role,
  type text not null,            -- installment_due | overdue | approval_pending | low_cash | salary_due
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- 7) ROW-LEVEL SECURITY for the new tables
--    Consistent with the app model: authenticated users pass RLS; fine-grained
--    permission checks live in the server actions (lib/permissions.ts).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'audit_log','activities','leads','measurement_entries',
    'material_items','contractor_bills','notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_authenticated_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      t || '_authenticated_all', t
    );
  end loop;
end $$;
