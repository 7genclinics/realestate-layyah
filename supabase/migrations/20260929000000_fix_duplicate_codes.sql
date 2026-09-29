-- Stop "duplicate entry" on save.
-- 1. Store CNICs as digits so a dashed number and a plain number are one person.
-- 2. If a code sequence has fallen behind existing rows, skip codes that are already used.

update public.customers
set id_number = regexp_replace(id_number, '[^0-9]', '', 'g')
where id_type = 'cnic'
  and id_number is not null
  and id_number is distinct from regexp_replace(id_number, '[^0-9]', '', 'g');

update public.customers
set id_number = null
where id_number is not null
  and btrim(id_number) = '';

create or replace function private.set_customer_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.customers where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a customer code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_cash_voucher_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'VCH-' || lpad(nextval('public.cash_voucher_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.cash_transactions where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a voucher code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_sale_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'SAL-' || lpad(nextval('public.sale_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.sales where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a sale code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_receipt_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'RCP-' || lpad(nextval('public.receipt_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.receipts where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a receipt code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_party_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'PAR-' || lpad(nextval('public.party_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.parties where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a party code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_property_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'PRT-' || lpad(nextval('public.property_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.properties where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a property code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_document_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'DOC-' || lpad(nextval('public.document_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.documents where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a document code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_contract_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'WO-' || lpad(nextval('public.contract_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.contracts where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a work order code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function private.set_land_parcel_code()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.code is null or btrim(new.code) = '' then
    loop
      attempts := attempts + 1;
      candidate := 'LND-' || lpad(nextval('public.land_parcel_code_seq')::text, 4, '0');
      exit when not exists (select 1 from public.land_parcels where code = candidate);
      if attempts > 50 then
        raise exception 'Could not allocate a land code';
      end if;
    end loop;
    new.code := candidate;
  end if;
  new.paid_amount := coalesce(new.paid_amount, 0);
  new.remaining_amount := greatest(new.purchase_value - new.paid_amount, 0);
  return new;
end;
$$;

-- Move each sequence up to the highest code already stored, when it has fallen behind.
select setval('public.customer_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.customers
  where code ~ '^CUS-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.customer_code_seq);

select setval('public.cash_voucher_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.cash_transactions
  where code ~ '^VCH-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.cash_voucher_code_seq);

select setval('public.sale_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.sales
  where code ~ '^SAL-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.sale_code_seq);

select setval('public.receipt_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.receipts
  where code ~ '^RCP-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.receipt_code_seq);

select setval('public.party_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.parties
  where code ~ '^PAR-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.party_code_seq);

select setval('public.property_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.properties
  where code ~ '^PRT-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.property_code_seq);

select setval('public.document_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.documents
  where code ~ '^DOC-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.document_code_seq);

select setval('public.land_parcel_code_seq', s.max_n, true)
from (
  select max(substring(code from '[0-9]+$')::bigint) as max_n
  from public.land_parcels
  where code ~ '^LND-[0-9]+$'
) s
where s.max_n is not null
  and s.max_n >= (select last_value from public.land_parcel_code_seq);
