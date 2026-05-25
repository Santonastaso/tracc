alter table public.outbound
  add column if not exists batch_id uuid;

update public.outbound
set batch_id = nullif(items->0->>'batch_id', '')::uuid
where batch_id is null
  and jsonb_typeof(items) = 'array'
  and items->0 ? 'batch_id'
  and nullif(items->0->>'batch_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

create index if not exists outbound_batch_id_idx
  on public.outbound (batch_id)
  where batch_id is not null;

create or replace function public.create_outbound_batch(
  p_batch_id uuid,
  p_operator_name text,
  p_withdrawals jsonb
)
returns setof public.outbound
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if p_batch_id is null then
    raise exception 'batch id is required';
  end if;

  if jsonb_typeof(p_withdrawals) <> 'array' or jsonb_array_length(p_withdrawals) = 0 then
    raise exception 'withdrawals must be a non-empty array';
  end if;

  return query
  insert into public.outbound (
    batch_id,
    silo_id,
    quantity_kg,
    operator_name,
    items,
    created_at,
    updated_at
  )
  select
    p_batch_id,
    (w.withdrawal->>'silo_id')::integer,
    (w.withdrawal->>'quantity_kg')::numeric,
    p_operator_name,
    coalesce(w.withdrawal->'items', '[]'::jsonb),
    v_now,
    v_now
  from jsonb_array_elements(p_withdrawals) as w(withdrawal)
  returning *;
end;
$$;

create or replace function public.get_silo_stock_report(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_silo_id integer default null,
  p_snapshot_at timestamptz default null
)
returns table (
  id integer,
  name character varying,
  capacity_kg integer,
  allowed_material_ids integer[],
  created_at timestamptz,
  updated_at timestamptz,
  "totalInbound" numeric,
  "totalOutbound" numeric,
  "currentStock" numeric,
  "utilizationPercentage" numeric,
  "snapshotDateTime" timestamptz
)
language sql
security invoker
set search_path = public
as $$
  with scoped_silos as (
    select s.*
    from public.silos s
    where p_silo_id is null or s.id = p_silo_id
  ),
  inbound_totals as (
    select i.silo_id, coalesce(sum(i.quantity_kg), 0) as total
    from public.inbound i
    where (p_silo_id is null or i.silo_id = p_silo_id)
      and (
        (
          p_snapshot_at is not null
          and i.created_at <= p_snapshot_at
        )
        or (
          p_snapshot_at is null
          and (p_start_at is null or i.created_at >= p_start_at)
          and (p_end_at is null or i.created_at <= p_end_at)
        )
      )
    group by i.silo_id
  ),
  outbound_totals as (
    select o.silo_id, coalesce(sum(o.quantity_kg), 0) as total
    from public.outbound o
    where (p_silo_id is null or o.silo_id = p_silo_id)
      and (
        (
          p_snapshot_at is not null
          and o.created_at <= p_snapshot_at
        )
        or (
          p_snapshot_at is null
          and (p_start_at is null or o.created_at >= p_start_at)
          and (p_end_at is null or o.created_at <= p_end_at)
        )
      )
    group by o.silo_id
  )
  select
    s.id,
    s.name,
    s.capacity_kg,
    s.allowed_material_ids,
    s.created_at,
    s.updated_at,
    coalesce(i.total, 0) as "totalInbound",
    coalesce(o.total, 0) as "totalOutbound",
    coalesce(i.total, 0) - coalesce(o.total, 0) as "currentStock",
    case
      when s.capacity_kg > 0 then
        ((coalesce(i.total, 0) - coalesce(o.total, 0)) / s.capacity_kg) * 100
      else 0
    end as "utilizationPercentage",
    p_snapshot_at as "snapshotDateTime"
  from scoped_silos s
  left join inbound_totals i on i.silo_id = s.id
  left join outbound_totals o on o.silo_id = s.id
  order by s.id;
$$;

grant execute on function public.create_outbound_batch(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.get_silo_stock_report(timestamptz, timestamptz, integer, timestamptz) to anon, authenticated;
