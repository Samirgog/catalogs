-- Marketing campaigns, automations and client retention workflows

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema cron;

create or replace function public.http_post_json_with_headers(
  p_url text,
  p_body jsonb,
  p_headers jsonb
)
returns void
language plpgsql
as $$
begin
  if to_regprocedure('extensions.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb),
      5000
    );
  elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb,jsonb)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb)
    );
  elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb)
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb),
      5000
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb)
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      jsonb_build_object('Content-Type', 'application/json') || coalesce(p_headers, '{}'::jsonb)
    );
  else
    raise exception 'No compatible http_post signature found (extensions/net)';
  end if;
end;
$$;

create or replace function public.http_post_json(
  p_url text,
  p_body jsonb
)
returns void
language plpgsql
as $$
begin
  perform public.http_post_json_with_headers(p_url, p_body, '{}'::jsonb);
end;
$$;

alter table public.users
  add column if not exists birthday_at date null,
  add column if not exists marketing_opt_in boolean not null default true;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  title text not null,
  audience_segment text not null default 'all',
  message_kind text not null default 'text',
  message_title text null,
  message_text text not null,
  cta_label text null,
  cta_url text null,
  promo_code text null,
  product_ids jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz null,
  sent_at timestamptz null,
  status text not null default 'draft',
  recipient_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_campaigns_catalog_status_idx
  on public.marketing_campaigns (catalog_id, status, created_at desc);

create table if not exists public.marketing_campaign_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  chat_id bigint null,
  status text not null default 'pending',
  error text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

create index if not exists marketing_campaign_runs_campaign_idx
  on public.marketing_campaign_runs (campaign_id, created_at desc);

create table if not exists public.marketing_automations (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  title text not null,
  trigger_key text not null,
  is_enabled boolean not null default true,
  cooldown_hours integer not null default 24,
  delay_minutes integer not null default 0,
  audience_segment text not null default 'all',
  message_title text null,
  message_text text not null,
  cta_label text null,
  cta_url text null,
  promo_code text null,
  product_ids jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_automations_catalog_enabled_idx
  on public.marketing_automations (catalog_id, is_enabled, created_at desc);

create table if not exists public.marketing_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.marketing_automations(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  event_id uuid null references public.customer_events(id) on delete set null,
  order_id uuid null references public.orders(id) on delete set null,
  run_key text not null unique,
  status text not null default 'pending',
  error text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists marketing_automation_runs_automation_idx
  on public.marketing_automation_runs (automation_id, created_at desc);

create or replace function public.notify_marketing_automation()
returns trigger
language plpgsql
as $$
declare
  v_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/marketing-automation-runner';
  v_secret text := 'YOUR_MARKETING_JOB_SECRET';
begin
  perform public.http_post_json_with_headers(
    v_url,
    jsonb_build_object(
      'catalogId', new.catalog_id,
      'jobSecret', v_secret
    ),
    jsonb_build_object('x-marketing-job-secret', v_secret)
  );
  return new;
end;
$$;

drop trigger if exists customer_events_notify_marketing_automation on public.customer_events;
create trigger customer_events_notify_marketing_automation
after insert on public.customer_events
for each row
execute function public.notify_marketing_automation();

drop trigger if exists orders_notify_marketing_automation on public.orders;
create trigger orders_notify_marketing_automation
after insert or update of status on public.orders
for each row
execute function public.notify_marketing_automation();

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'marketing-automation-runner') then
    perform cron.schedule(
      'marketing-automation-runner',
      '*/5 * * * *',
      $cmd$select public.http_post_json(
        'https://YOUR_PROJECT_REF.supabase.co/functions/v1/marketing-automation-runner',
        jsonb_build_object('jobSecret', 'YOUR_MARKETING_JOB_SECRET')
      );$cmd$
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'marketing-campaign-dispatch') then
    perform cron.schedule(
      'marketing-campaign-dispatch',
      '*/5 * * * *',
      $cmd$select public.http_post_json(
        'https://YOUR_PROJECT_REF.supabase.co/functions/v1/marketing-campaign-dispatch',
        jsonb_build_object('jobSecret', 'YOUR_MARKETING_JOB_SECRET')
      );$cmd$
    );
  end if;
end
$$;
