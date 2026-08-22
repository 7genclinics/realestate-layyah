-- Payment transfer-slip storage + slip_path columns
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run).
-- Safe to re-run: every statement is idempotent.
--
-- Enables attaching a bank-transfer / cheque slip image or PDF to a payment on
-- the Receive Payment, Land Payment, and Party (contractor) Payment forms.
-- Until this runs, cash payments keep working and any bank-transfer/cheque
-- payment with an attached slip returns a clear "run migration" error.

-- 1) Where the slip lives on each payment record (nullable — cash has none).
alter table public.receipts
  add column if not exists slip_path text;

alter table public.land_payments
  add column if not exists slip_path text;

alter table public.contract_payments
  add column if not exists slip_path text;

-- 2) Private "payment-slips" storage bucket (10 MB/file, images + PDF).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-slips',
  'payment-slips',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

-- 3) Storage RLS: slips are internal finance records, so any authenticated
--    staff member may read and manage them (mirrors who can post payments).
drop policy if exists "Payment slips read" on storage.objects;
create policy "Payment slips read"
  on storage.objects for select to authenticated
  using ( bucket_id = 'payment-slips' );

drop policy if exists "Payment slips insert" on storage.objects;
create policy "Payment slips insert"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'payment-slips' );

drop policy if exists "Payment slips update" on storage.objects;
create policy "Payment slips update"
  on storage.objects for update to authenticated
  using ( bucket_id = 'payment-slips' )
  with check ( bucket_id = 'payment-slips' );

drop policy if exists "Payment slips delete" on storage.objects;
create policy "Payment slips delete"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'payment-slips' );
