-- =============================================================
-- 1st ROOT Admin — Part 4: RPC Functions (atomic operations)
-- Run AFTER 202610090003_admin_content.sql
-- =============================================================
begin;

-- ─────────────────────────────────────────────────────────────
-- RPC: adjust_stock
-- Atomically adjusts physical_stock and logs the movement.
-- Called by admin only. Prevents stock going below 0.
-- ─────────────────────────────────────────────────────────────
create or replace function public.adjust_stock(
  p_inventory_item_id uuid,
  p_adjustment_type   text,
  p_quantity          int,
  p_reason            text,
  p_reference         text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item        public.inventory_items%rowtype;
  v_change      int;
  v_stock_after int;
begin
  -- Admin only
  if not (select firstroot_private.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  -- Lock the row
  select * into v_item
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found' using errcode = 'P0002';
  end if;

  -- Determine direction
  if p_adjustment_type in ('ADD','RETURNED') then
    v_change := abs(p_quantity);
  else
    v_change := -abs(p_quantity);
  end if;

  v_stock_after := v_item.physical_stock + v_change;

  if v_stock_after < 0 then
    raise exception 'Stock cannot go below zero. Available: %', v_item.physical_stock
      using errcode = 'P0001';
  end if;

  -- Update stock
  update public.inventory_items
  set physical_stock = v_stock_after
  where id = p_inventory_item_id;

  -- Log movement
  insert into public.inventory_movements (
    inventory_item_id, adjustment_type, quantity_change,
    stock_before, stock_after, reason, reference, performed_by
  ) values (
    p_inventory_item_id, p_adjustment_type, v_change,
    v_item.physical_stock, v_stock_after,
    p_reason, p_reference, auth.uid()
  );

  return jsonb_build_object(
    'ok', true,
    'stock_before', v_item.physical_stock,
    'stock_after', v_stock_after,
    'change', v_change
  );
end $$;

revoke all on function public.adjust_stock(uuid,text,int,text,text) from public, anon;
grant execute on function public.adjust_stock(uuid,text,int,text,text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: update_order_status
-- Atomically updates order status and appends history entry.
-- ─────────────────────────────────────────────────────────────
create or replace function public.update_order_status(
  p_order_id text,
  p_status   text,
  p_note     text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not (select firstroot_private.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_status_history (order_id, status, note, changed_by)
  values (p_order_id, p_status, p_note, auth.uid());

  -- Auto-create shipment row when order moves to PACKED
  if p_status = 'PACKED' then
    insert into public.shipments (order_id)
    values (p_order_id)
    on conflict (order_id) do nothing;
  end if;

  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', p_status);
end $$;

revoke all on function public.update_order_status(text,text,text) from public, anon;
grant execute on function public.update_order_status(text,text,text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: update_return_decision
-- Atomically updates return status + refund status together.
-- ─────────────────────────────────────────────────────────────
create or replace function public.update_return_decision(
  p_return_id     uuid,
  p_status        text,
  p_refund_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select firstroot_private.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  update public.returns
  set status = p_status, refund_status = p_refund_status
  where id = p_return_id;

  if not found then
    raise exception 'Return not found' using errcode = 'P0002';
  end if;

  -- If refund approved, sync payment record
  if p_refund_status = 'REFUNDED' then
    update public.payments
    set status = 'REFUNDED', refund_status = 'REFUNDED'
    where order_id = (select order_id from public.returns where id = p_return_id);
  end if;

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.update_return_decision(uuid,text,text) from public, anon;
grant execute on function public.update_return_decision(uuid,text,text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_dashboard_stats
-- Returns aggregated KPIs for the admin dashboard.
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not (select firstroot_private.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_revenue',      coalesce(sum(total), 0),
    'total_orders',       count(*),
    'pending_orders',     count(*) filter (where status in ('PENDING','CONFIRMED')),
    'processing_orders',  count(*) filter (where status in ('PROCESSING','PACKED')),
    'shipped_orders',     count(*) filter (where status in ('SHIPPED','OUT FOR DELIVERY')),
    'delivered_orders',   count(*) filter (where status = 'DELIVERED'),
    'cancelled_orders',   count(*) filter (where status = 'CANCELLED'),
    'today_revenue',      coalesce(sum(total) filter (where created_at >= current_date), 0),
    'today_orders',       count(*) filter (where created_at >= current_date)
  )
  into v_result
  from public.orders;

  -- Append customer count
  v_result := v_result || jsonb_build_object(
    'total_customers', (select count(*) from public.profiles where role = 'CUSTOMER'),
    'low_stock_count', (
      select count(*) from public.inventory_items
      where (physical_stock - reserved_stock) <= low_stock_threshold
    ),
    'pending_returns', (
      select count(*) from public.returns where refund_status = 'PENDING'
    )
  );

  return v_result;
end $$;

revoke all on function public.get_dashboard_stats() from public, anon;
grant execute on function public.get_dashboard_stats() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_sales_chart
-- Returns daily revenue totals for a given number of days.
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_sales_chart(p_days int default 7)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not (select firstroot_private.is_admin()) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'date',    to_char(day, 'DD Mon'),
      'revenue', coalesce(daily.revenue, 0),
      'orders',  coalesce(daily.order_count, 0)
    )
    order by day
  )
  into v_result
  from generate_series(
    current_date - (p_days - 1),
    current_date,
    '1 day'::interval
  ) as day
  left join (
    select
      date_trunc('day', created_at)::date as order_date,
      sum(total)                          as revenue,
      count(*)                            as order_count
    from public.orders
    where created_at >= current_date - (p_days - 1)
      and status not in ('CANCELLED','REFUNDED')
    group by order_date
  ) daily on daily.order_date = day;

  return coalesce(v_result, '[]'::jsonb);
end $$;

revoke all on function public.get_sales_chart(int) from public, anon;
grant execute on function public.get_sales_chart(int) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage bucket: product-images
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Storage RLS: admin can upload/delete, public can read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'product_images_admin_upload'
  ) then
    create policy product_images_admin_upload on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'product-images'
        and (select firstroot_private.is_admin())
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'product_images_admin_delete'
  ) then
    create policy product_images_admin_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'product-images'
        and (select firstroot_private.is_admin())
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'product_images_public_read'
  ) then
    create policy product_images_public_read on storage.objects
      for select using (bucket_id = 'product-images');
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
