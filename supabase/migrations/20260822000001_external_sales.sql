-- External (off-society) sales
-- ---------------------------------------------------------------------------
-- Lets the firm record a plot / shop / other unit sold to a customer that is
-- NOT part of society inventory (resale, brokerage, open-market deal). Such a
-- sale has no inventory `property` row and no `society`, yet it still drives
-- installments, receipts, the cash book and reports exactly like a normal
-- society sale.
--
-- Safe & reversible: only relaxes two NOT NULL constraints and adds two
-- columns with a default. Existing rows are untouched (is_external = false).
-- ---------------------------------------------------------------------------

begin;

-- 1. A sale may now exist without a society inventory unit.
alter table public.sales alter column property_id drop not null;
alter table public.sales alter column society_id  drop not null;

-- 2. Flag + free-form location for external deals. (seller_name, registry_no
--    and khata_no already exist on the table and are reused for these deals.)
alter table public.sales add column if not exists is_external boolean not null default false;
alter table public.sales add column if not exists external_location text;

commit;

-- Rollback (if ever needed):
--   alter table public.sales drop column if exists external_location;
--   alter table public.sales drop column if exists is_external;
--   -- (re-adding NOT NULL requires backfilling property_id/society_id first)
