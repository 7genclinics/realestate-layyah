-- =============================================================================
-- Installment due / overdue alert cron
-- Runs daily at 08:00 PKT (03:00 UTC).
-- Inserts notifications for:
--   • Installments due exactly 3 days from now  → "Due soon"
--   • Installments due today                    → "Due today"
--   • Installments that became overdue today    → "Overdue"
-- Targets every profile with role IN ('owner','admin','manager').
-- Safe to re-run: ON CONFLICT DO NOTHING prevents duplicates.
-- =============================================================================

-- Enable pg_cron if not already enabled (requires Supabase Pro or above)
create extension if not exists pg_cron with schema extensions;

-- ---------------------------------------------------------------------------
-- Function: notify_installment_alerts()
-- ---------------------------------------------------------------------------
create or replace function public.notify_installment_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today   date := current_date;
  v_in3     date := current_date + interval '3 days';
  rec       record;
  target    record;
begin
  -- Collect admin-level user IDs to notify
  for target in
    select id from public.profiles
    where role in ('owner', 'admin', 'manager')
  loop

    -- 1) Due in exactly 3 days ("Due soon")
    for rec in
      select
        i.id,
        i.period_label,
        i.scheduled_amount,
        i.due_date,
        s.code  as sale_code,
        c.full_name as customer_name
      from public.installments i
      join public.sales s on s.id = i.sale_id
      left join public.customers c on c.id = s.customer_id
      where i.due_date = v_in3
        and coalesce(i.status_override, '') not in ('paid', 'waived')
        and (i.received_amount is null or i.received_amount < i.scheduled_amount)
    loop
      insert into public.notifications
        (user_id, type, title, body, entity_type, entity_id, is_read)
      values (
        target.id,
        'installment_due_soon',
        'Installment due in 3 days',
        rec.customer_name || ' — ' || rec.sale_code || ' · ' ||
          rec.period_label || ' · PKR ' ||
          to_char(rec.scheduled_amount, 'FM9,999,999,999'),
        'installment',
        rec.id::text,
        false
      )
      on conflict do nothing;
    end loop;

    -- 2) Due today
    for rec in
      select
        i.id,
        i.period_label,
        i.scheduled_amount,
        i.due_date,
        s.code  as sale_code,
        c.full_name as customer_name
      from public.installments i
      join public.sales s on s.id = i.sale_id
      left join public.customers c on c.id = s.customer_id
      where i.due_date = v_today
        and coalesce(i.status_override, '') not in ('paid', 'waived')
        and (i.received_amount is null or i.received_amount < i.scheduled_amount)
    loop
      insert into public.notifications
        (user_id, type, title, body, entity_type, entity_id, is_read)
      values (
        target.id,
        'installment_due_today',
        'Installment due today',
        rec.customer_name || ' — ' || rec.sale_code || ' · ' ||
          rec.period_label || ' · PKR ' ||
          to_char(rec.scheduled_amount, 'FM9,999,999,999'),
        'installment',
        rec.id::text,
        false
      )
      on conflict do nothing;
    end loop;

    -- 3) Overdue — only fires on the day the installment first crosses over
    for rec in
      select
        i.id,
        i.period_label,
        i.scheduled_amount,
        i.due_date,
        s.code  as sale_code,
        c.full_name as customer_name,
        (v_today - i.due_date) as days_overdue
      from public.installments i
      join public.sales s on s.id = i.sale_id
      left join public.customers c on c.id = s.customer_id
      where i.due_date < v_today
        and coalesce(i.status_override, '') not in ('paid', 'waived')
        and (i.received_amount is null or i.received_amount < i.scheduled_amount)
        and (v_today - i.due_date) = 1
    loop
      insert into public.notifications
        (user_id, type, title, body, entity_type, entity_id, is_read)
      values (
        target.id,
        'installment_overdue',
        'Installment overdue',
        rec.customer_name || ' — ' || rec.sale_code || ' · ' ||
          rec.period_label || ' — overdue by ' ||
          rec.days_overdue || ' day(s) · PKR ' ||
          to_char(rec.scheduled_amount, 'FM9,999,999,999'),
        'installment',
        rec.id::text,
        false
      )
      on conflict do nothing;
    end loop;

  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Schedule: daily at 03:00 UTC (08:00 PKT)
-- ---------------------------------------------------------------------------
select cron.schedule(
  'installment-alert-daily',
  '0 3 * * *',
  $$select public.notify_installment_alerts();$$
);
