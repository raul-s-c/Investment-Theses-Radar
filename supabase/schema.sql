-- Investment Theses Radar - future Supabase schema
-- MVP status: not required yet. Keep this file as the migration plan for cloud sync,
-- shared quote cache and semi-anonymous aggregate interest by ticker.

create extension if not exists pgcrypto;

create table if not exists public.app_installations (
  id uuid primary key default gen_random_uuid(),
  installation_key text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.user_portfolios (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid not null references public.app_installations(id) on delete cascade,
  name text not null default 'Mi portfolio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.user_portfolios(id) on delete cascade,
  ticker text not null,
  company_name text,
  sector text,
  currency text,
  shares numeric(20, 6) not null default 0,
  average_cost numeric(20, 6) not null default 0,
  thesis text,
  drivers jsonb not null default '[]'::jsonb,
  breakers jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, ticker)
);

create table if not exists public.ticker_daily_cache (
  ticker text not null,
  cache_date date not null default current_date,
  source text not null,
  price numeric(20, 6),
  change_percent numeric(10, 4),
  currency text,
  fundamentals jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '18 hours'),
  primary key (ticker, cache_date, source)
);

create table if not exists public.thesis_reviews (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references public.app_installations(id) on delete set null,
  ticker text not null,
  review_date date not null default current_date,
  model text,
  score integer check (score between 0 and 100),
  input_hash text not null,
  output jsonb not null default '{}'::jsonb,
  token_estimate integer not null default 0,
  used_web_search boolean not null default false,
  created_at timestamptz not null default now(),
  unique (ticker, review_date, input_hash)
);

create table if not exists public.ticker_interest_daily (
  ticker text not null,
  interest_date date not null default current_date,
  watcher_count integer not null default 0,
  review_count integer not null default 0,
  last_activity_at timestamptz not null default now(),
  primary key (ticker, interest_date)
);

create index if not exists portfolio_positions_portfolio_id_idx
  on public.portfolio_positions (portfolio_id);

create index if not exists portfolio_positions_ticker_idx
  on public.portfolio_positions (ticker);

create index if not exists ticker_daily_cache_ticker_expires_idx
  on public.ticker_daily_cache (ticker, expires_at desc);

create index if not exists thesis_reviews_ticker_date_idx
  on public.thesis_reviews (ticker, review_date desc);

create index if not exists ticker_interest_daily_ticker_date_idx
  on public.ticker_interest_daily (ticker, interest_date desc);

alter table public.app_installations enable row level security;
alter table public.user_portfolios enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.ticker_daily_cache enable row level security;
alter table public.thesis_reviews enable row level security;
alter table public.ticker_interest_daily enable row level security;

-- Phase 1, solo use:
-- Keep Supabase project private and access these tables through a tiny proxy/API.
-- Do not expose service_role in GitHub Pages.

-- Phase 2, with Supabase Auth:
-- Add owner_id uuid references auth.users(id) to app_installations or user_portfolios,
-- then replace proxy-only access with auth.uid() RLS policies.

-- Public aggregate/cache read policies can be enabled later if desired:
-- create policy "read public quote cache"
--   on public.ticker_daily_cache for select
--   using (true);
--
-- create policy "read public ticker interest"
--   on public.ticker_interest_daily for select
--   using (true);
