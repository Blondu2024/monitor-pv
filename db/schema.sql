-- Monitor-PV schema (Supabase project DEDICAT pt monitor-pv, separat de CreazaApp)
-- Rulează în Supabase SQL Editor sau via Management API.
-- Praguri implicite din lucrare cap 4.5 (Profire Radu): 80% randament, 65°C warning, 75°C critic.

create extension if not exists "pgcrypto";

-- Site-uri (centrale PV per locație)
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  country text not null default 'RO',
  gps_lat double precision not null,
  gps_lng double precision not null,
  peak_power_kwp double precision not null,
  commissioned_at date,
  client_name text,
  created_at timestamptz not null default now()
);

-- Device-uri (invertoare, contoare, baterii) per site
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  kind text not null check (kind in ('inverter', 'meter', 'battery')),
  manufacturer text not null,
  model text not null,
  serial_number text not null unique,
  modbus_slave_id int,
  rated_power_kw double precision,
  status text not null default 'online' check (status in ('online', 'offline', 'warning', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists devices_site_idx on public.devices(site_id);

-- Măsurători time-series
create table if not exists public.measurements (
  id bigserial primary key,
  device_id uuid not null references public.devices(id) on delete cascade,
  ts timestamptz not null,
  -- inverter
  ac_power_w double precision,
  dc_power_w double precision,
  ac_voltage_v double precision,
  ac_current_a double precision,
  ac_frequency_hz double precision,
  energy_today_wh double precision,
  energy_total_wh double precision,
  -- ambient / sensors
  module_temp_c double precision,
  ambient_temp_c double precision,
  irradiance_wm2 double precision,
  wind_speed_ms double precision,
  -- meter
  grid_import_w double precision,
  grid_export_w double precision,
  -- battery
  soc_percent double precision,
  battery_power_w double precision,
  battery_voltage_v double precision
);

create index if not exists measurements_device_ts_idx on public.measurements(device_id, ts desc);
create index if not exists measurements_ts_idx on public.measurements(ts desc);

-- Alarme
create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  code text not null,
  message text not null,
  status text not null default 'active' check (status in ('active', 'acknowledged', 'cleared')),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  cleared_at timestamptz
);

create index if not exists alarms_status_idx on public.alarms(status, created_at desc);
create index if not exists alarms_device_idx on public.alarms(device_id, created_at desc);

-- Praguri alarme configurabile per site (default din lucrare cap 4.5)
create table if not exists public.alarm_thresholds (
  site_id uuid primary key references public.sites(id) on delete cascade,
  performance_ratio_min double precision not null default 0.80,
  module_temp_warning_c double precision not null default 65.0,
  module_temp_critical_c double precision not null default 75.0,
  voltage_min_v double precision not null default 207.0,
  voltage_max_v double precision not null default 253.0,
  frequency_min_hz double precision not null default 49.5,
  frequency_max_hz double precision not null default 50.5,
  soc_min_percent double precision not null default 20.0,
  offline_timeout_seconds int not null default 60
);

-- RLS: pt MVP demo lăsăm read public (anon). Strângem când punem auth real.
alter table public.sites enable row level security;
alter table public.devices enable row level security;
alter table public.measurements enable row level security;
alter table public.alarms enable row level security;
alter table public.alarm_thresholds enable row level security;

drop policy if exists "read all anon" on public.sites;
drop policy if exists "read all anon" on public.devices;
drop policy if exists "read all anon" on public.measurements;
drop policy if exists "read all anon" on public.alarms;
drop policy if exists "read all anon" on public.alarm_thresholds;

create policy "read all anon" on public.sites for select using (true);
create policy "read all anon" on public.devices for select using (true);
create policy "read all anon" on public.measurements for select using (true);
create policy "read all anon" on public.alarms for select using (true);
create policy "read all anon" on public.alarm_thresholds for select using (true);
