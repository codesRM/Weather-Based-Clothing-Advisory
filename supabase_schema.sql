-- ============================================================
--  WeatherWear — Supabase Database Schema
--  Paste this into the Supabase SQL Editor and click "Run"
--  Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Profiles (extends Supabase Auth users) ──────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null,
  created_at timestamptz default now()
);

-- Auto-create profile on new auth user (optional trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── User Preferences ────────────────────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  default_city     text,
  temp_unit        text default 'celsius' check (temp_unit in ('celsius','fahrenheit')),
  style_preference text default 'casual'  check (style_preference in ('casual','formal','sporty','minimal')),
  cold_threshold   smallint default 15,
  hot_threshold    smallint default 28,
  updated_at       timestamptz default now()
);

-- ─── Search History ───────────────────────────────────────────────────────────
create table if not exists public.search_history (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  city        text not null,
  country     text,
  temp        smallint,
  condition   text,
  searched_at timestamptz default now()
);

create index if not exists idx_search_history_user on public.search_history(user_id, searched_at desc);

-- ─── Saved Outfits (future feature) ──────────────────────────────────────────
create table if not exists public.saved_outfits (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  outfit_name text not null,
  items       jsonb not null,
  min_temp    smallint,
  max_temp    smallint,
  conditions  text,
  created_at  timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.user_preferences enable row level security;
alter table public.search_history   enable row level security;
alter table public.saved_outfits    enable row level security;

-- Profiles: users can only read/update their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Preferences: own rows only
create policy "Users manage own preferences"
  on public.user_preferences for all using (auth.uid() = user_id);

-- History: own rows only
create policy "Users manage own history"
  on public.search_history for all using (auth.uid() = user_id);

-- Outfits: own rows only
create policy "Users manage own outfits"
  on public.saved_outfits for all using (auth.uid() = user_id);
