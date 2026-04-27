create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('income', 'expense');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type public.transaction_status as enum ('pending', 'paid', 'late', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type public.goal_status as enum ('active', 'completed', 'failed', 'paused', 'late');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_shared_access_target_acceptance()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.target_user_id and auth.uid() <> old.owner_id then
    if new.owner_id is distinct from old.owner_id
      or new.target_user_id is distinct from old.target_user_id
      or new.target_user_email is distinct from old.target_user_email
      or new.permission_level is distinct from old.permission_level
      or new.created_at is distinct from old.created_at
      or new.id is distinct from old.id then
      raise exception 'target user can only accept shared access';
    end if;

    if new.status <> 'accepted' then
      raise exception 'target user can only change status to accepted';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  hourly_rate numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  status public.transaction_status not null default 'pending',
  description text not null,
  amount numeric(14, 2) not null,
  due_date date not null,
  payment_date date,
  payment_method text,
  is_recurring boolean not null default false,
  recurrence_type text,
  recurrence_interval integer,
  recurrence_source_id uuid,
  recurrence_start_date date,
  recurrence_end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists financial_transactions_recurrence_unique_idx
  on public.financial_transactions (user_id, recurrence_source_id, due_date)
  where recurrence_source_id is not null;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('economy', 'limit', 'debt')),
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  status public.goal_status not null default 'active',
  start_date date not null,
  end_date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reserve_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  type text not null check (type in ('deposit', 'withdrawal')),
  description text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  value numeric(14, 2) not null,
  current_value numeric(14, 2),
  date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_user_email text not null,
  permission_level text not null check (permission_level in ('full', 'finances', 'investments')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  total_amount numeric(14, 2) not null,
  remaining_amount numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_fund_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null,
  initial_value numeric(14, 2) not null,
  current_value numeric(14, 2) not null,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists set_financial_transactions_updated_at on public.financial_transactions;
create trigger set_financial_transactions_updated_at before update on public.financial_transactions for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at before update on public.goals for each row execute function public.set_updated_at();

drop trigger if exists set_reserve_entries_updated_at on public.reserve_entries;
create trigger set_reserve_entries_updated_at before update on public.reserve_entries for each row execute function public.set_updated_at();

drop trigger if exists set_investment_entries_updated_at on public.investment_entries;
create trigger set_investment_entries_updated_at before update on public.investment_entries for each row execute function public.set_updated_at();

drop trigger if exists set_shared_access_updated_at on public.shared_access;
create trigger set_shared_access_updated_at before update on public.shared_access for each row execute function public.set_updated_at();

drop trigger if exists enforce_shared_access_target_acceptance on public.shared_access;
create trigger enforce_shared_access_target_acceptance
  before update on public.shared_access
  for each row
  execute function public.enforce_shared_access_target_acceptance();

drop trigger if exists set_financial_settings_updated_at on public.financial_settings;
create trigger set_financial_settings_updated_at before update on public.financial_settings for each row execute function public.set_updated_at();

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at before update on public.debts for each row execute function public.set_updated_at();

drop trigger if exists set_savings_entries_updated_at on public.savings_entries;
create trigger set_savings_entries_updated_at before update on public.savings_entries for each row execute function public.set_updated_at();

drop trigger if exists set_emergency_fund_entries_updated_at on public.emergency_fund_entries;
create trigger set_emergency_fund_entries_updated_at before update on public.emergency_fund_entries for each row execute function public.set_updated_at();

drop trigger if exists set_investments_updated_at on public.investments;
create trigger set_investments_updated_at before update on public.investments for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.reserve_entries enable row level security;
alter table public.investment_entries enable row level security;
alter table public.shared_access enable row level security;
alter table public.financial_settings enable row level security;
alter table public.payment_methods enable row level security;
alter table public.debts enable row level security;
alter table public.goal_updates enable row level security;
alter table public.savings_entries enable row level security;
alter table public.emergency_fund_entries enable row level security;
alter table public.investments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "profiles_select_shared_access" on public.profiles;
create policy "profiles_select_shared_access" on public.profiles
for select
using (
  id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
  )
);

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);
drop policy if exists "categories_select_shared" on public.categories;
create policy "categories_select_shared" on public.categories
for select
using (
  user_id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
      and sa.permission_level in ('full', 'finances')
  )
);

drop policy if exists "financial_transactions_select_own" on public.financial_transactions;
create policy "financial_transactions_select_own" on public.financial_transactions for select using (auth.uid() = user_id);
drop policy if exists "financial_transactions_insert_own" on public.financial_transactions;
create policy "financial_transactions_insert_own" on public.financial_transactions for insert with check (auth.uid() = user_id);
drop policy if exists "financial_transactions_update_own" on public.financial_transactions;
create policy "financial_transactions_update_own" on public.financial_transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "financial_transactions_delete_own" on public.financial_transactions;
create policy "financial_transactions_delete_own" on public.financial_transactions for delete using (auth.uid() = user_id);
drop policy if exists "financial_transactions_select_shared" on public.financial_transactions;
create policy "financial_transactions_select_shared" on public.financial_transactions
for select
using (
  user_id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
      and sa.permission_level in ('full', 'finances')
  )
);

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);
drop policy if exists "goals_select_shared" on public.goals;
create policy "goals_select_shared" on public.goals
for select
using (
  user_id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
      and sa.permission_level in ('full', 'finances')
  )
);

drop policy if exists "reserve_entries_select_own" on public.reserve_entries;
create policy "reserve_entries_select_own" on public.reserve_entries for select using (auth.uid() = user_id);
drop policy if exists "reserve_entries_insert_own" on public.reserve_entries;
create policy "reserve_entries_insert_own" on public.reserve_entries for insert with check (auth.uid() = user_id);
drop policy if exists "reserve_entries_update_own" on public.reserve_entries;
create policy "reserve_entries_update_own" on public.reserve_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reserve_entries_delete_own" on public.reserve_entries;
create policy "reserve_entries_delete_own" on public.reserve_entries for delete using (auth.uid() = user_id);
drop policy if exists "reserve_entries_select_shared" on public.reserve_entries;
create policy "reserve_entries_select_shared" on public.reserve_entries
for select
using (
  user_id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
      and sa.permission_level in ('full', 'investments')
  )
);

drop policy if exists "investment_entries_select_own" on public.investment_entries;
create policy "investment_entries_select_own" on public.investment_entries for select using (auth.uid() = user_id);
drop policy if exists "investment_entries_insert_own" on public.investment_entries;
create policy "investment_entries_insert_own" on public.investment_entries for insert with check (auth.uid() = user_id);
drop policy if exists "investment_entries_update_own" on public.investment_entries;
create policy "investment_entries_update_own" on public.investment_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "investment_entries_delete_own" on public.investment_entries;
create policy "investment_entries_delete_own" on public.investment_entries for delete using (auth.uid() = user_id);
drop policy if exists "investment_entries_select_shared" on public.investment_entries;
create policy "investment_entries_select_shared" on public.investment_entries
for select
using (
  user_id in (
    select sa.owner_id
    from public.shared_access sa
    where sa.target_user_id = auth.uid()
      and sa.status = 'accepted'
      and sa.permission_level in ('full', 'investments')
  )
);

drop policy if exists "shared_access_select_participants" on public.shared_access;
create policy "shared_access_select_participants" on public.shared_access
for select
using (auth.uid() = owner_id or auth.uid() = target_user_id);

drop policy if exists "shared_access_insert_owner" on public.shared_access;
create policy "shared_access_insert_owner" on public.shared_access
for insert
with check (auth.uid() = owner_id);

drop policy if exists "shared_access_update_owner_or_target_accept" on public.shared_access;
create policy "shared_access_update_owner_or_target_accept" on public.shared_access
for update
using (auth.uid() = owner_id or auth.uid() = target_user_id)
with check (
  auth.uid() = owner_id
  or (
    auth.uid() = target_user_id
    and status = 'accepted'
  )
);

drop policy if exists "shared_access_delete_owner" on public.shared_access;
create policy "shared_access_delete_owner" on public.shared_access
for delete
using (auth.uid() = owner_id);

drop policy if exists "financial_settings_select_own" on public.financial_settings;
create policy "financial_settings_select_own" on public.financial_settings for select using (auth.uid() = user_id);
drop policy if exists "financial_settings_insert_own" on public.financial_settings;
create policy "financial_settings_insert_own" on public.financial_settings for insert with check (auth.uid() = user_id);
drop policy if exists "financial_settings_update_own" on public.financial_settings;
create policy "financial_settings_update_own" on public.financial_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "financial_settings_delete_own" on public.financial_settings;
create policy "financial_settings_delete_own" on public.financial_settings for delete using (auth.uid() = user_id);

drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own" on public.payment_methods for select using (auth.uid() = user_id);
drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own" on public.payment_methods for insert with check (auth.uid() = user_id);
drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own" on public.payment_methods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own" on public.payment_methods for delete using (auth.uid() = user_id);

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own" on public.debts for select using (auth.uid() = user_id);
drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own" on public.debts for insert with check (auth.uid() = user_id);
drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own" on public.debts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own" on public.debts for delete using (auth.uid() = user_id);

drop policy if exists "goal_updates_select_own" on public.goal_updates;
create policy "goal_updates_select_own" on public.goal_updates
for select
using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_updates_insert_own" on public.goal_updates;
create policy "goal_updates_insert_own" on public.goal_updates
for insert
with check (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_updates_update_own" on public.goal_updates;
create policy "goal_updates_update_own" on public.goal_updates
for update
using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "goal_updates_delete_own" on public.goal_updates;
create policy "goal_updates_delete_own" on public.goal_updates
for delete
using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.user_id = auth.uid()
  )
);

drop policy if exists "savings_entries_select_own" on public.savings_entries;
create policy "savings_entries_select_own" on public.savings_entries for select using (auth.uid() = user_id);
drop policy if exists "savings_entries_insert_own" on public.savings_entries;
create policy "savings_entries_insert_own" on public.savings_entries for insert with check (auth.uid() = user_id);
drop policy if exists "savings_entries_update_own" on public.savings_entries;
create policy "savings_entries_update_own" on public.savings_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "savings_entries_delete_own" on public.savings_entries;
create policy "savings_entries_delete_own" on public.savings_entries for delete using (auth.uid() = user_id);

drop policy if exists "emergency_fund_entries_select_own" on public.emergency_fund_entries;
create policy "emergency_fund_entries_select_own" on public.emergency_fund_entries for select using (auth.uid() = user_id);
drop policy if exists "emergency_fund_entries_insert_own" on public.emergency_fund_entries;
create policy "emergency_fund_entries_insert_own" on public.emergency_fund_entries for insert with check (auth.uid() = user_id);
drop policy if exists "emergency_fund_entries_update_own" on public.emergency_fund_entries;
create policy "emergency_fund_entries_update_own" on public.emergency_fund_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "emergency_fund_entries_delete_own" on public.emergency_fund_entries;
create policy "emergency_fund_entries_delete_own" on public.emergency_fund_entries for delete using (auth.uid() = user_id);

drop policy if exists "investments_select_own" on public.investments;
create policy "investments_select_own" on public.investments for select using (auth.uid() = user_id);
drop policy if exists "investments_insert_own" on public.investments;
create policy "investments_insert_own" on public.investments for insert with check (auth.uid() = user_id);
drop policy if exists "investments_update_own" on public.investments;
create policy "investments_update_own" on public.investments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_delete_own" on public.investments for delete using (auth.uid() = user_id);