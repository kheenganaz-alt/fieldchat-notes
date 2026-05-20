create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  "displayName" text not null,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.sessions (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null check (status in ('active', 'paused', 'completed')),
  "startedAt" timestamptz not null,
  "endedAt" timestamptz,
  "durationSeconds" integer not null default 0,
  summary text,
  "routeId" text,
  discreet boolean not null default false,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.notes (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "sessionId" text not null references public.sessions(id) on delete cascade,
  body text not null,
  kind text not null check (kind in ('note', 'voice', 'system')),
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.timestamps (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "sessionId" text not null references public.sessions(id) on delete cascade,
  label text,
  "occurredAt" timestamptz not null,
  "elapsedSeconds" integer not null,
  "inputMethod" text not null,
  "createdAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.routes (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  name text not null,
  "estimatedMinutes" integer not null default 0,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.stops (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "routeId" text not null references public.routes(id) on delete cascade,
  name text not null,
  address text not null,
  status text not null check (status in ('Pending', 'Arrived', 'Completed', 'Skipped', 'Rescheduled')),
  "sortOrder" integer not null,
  notes text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.exports (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "sessionId" text not null references public.sessions(id) on delete cascade,
  format text not null check (format in ('pdf', 'docx', 'txt', 'csv')),
  "createdAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.settings (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "darkMode" boolean not null default false,
  "discreetMode" boolean not null default false,
  vibration boolean not null default true,
  "autoResume" boolean not null default true,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "syncedAt" timestamptz
);

create table if not exists public.photos (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "sessionId" text not null references public.sessions(id) on delete cascade,
  "dataUrl" text not null,
  caption text,
  "createdAt" timestamptz not null,
  "syncedAt" timestamptz
);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.notes enable row level security;
alter table public.timestamps enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.exports enable row level security;
alter table public.settings enable row level security;
alter table public.photos enable row level security;

create policy "users own rows" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "sessions own rows" on public.sessions for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "notes own rows" on public.notes for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "timestamps own rows" on public.timestamps for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "routes own rows" on public.routes for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "stops own rows" on public.stops for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "exports own rows" on public.exports for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "settings own rows" on public.settings for all using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy "photos own rows" on public.photos for all using (auth.uid() = "userId") with check (auth.uid() = "userId");

create index if not exists sessions_user_idx on public.sessions("userId");
create index if not exists notes_user_session_idx on public.notes("userId", "sessionId");
create index if not exists timestamps_user_session_idx on public.timestamps("userId", "sessionId");
create index if not exists routes_user_idx on public.routes("userId");
create index if not exists stops_user_route_idx on public.stops("userId", "routeId");
create index if not exists photos_user_session_idx on public.photos("userId", "sessionId");
