-- Migrație: parametri configurabili per dispozitiv (cerință susținere — „setare parametri la device").
-- Parametrii mapează pe registre Modbus reale (Huawei SUN2000 / Growatt MIN-TL-X):
--   limitare putere activă, factor de putere, praguri protecție tensiune/frecvență,
--   mod putere reactivă; pentru baterii: limite SOC + mod de operare.
-- Audit: updated_by reține emailul operatorului autentificat care a modificat.

create table if not exists public.device_settings (
  device_id uuid primary key references public.devices(id) on delete cascade,

  -- Invertor — control putere
  active_power_limit_pct double precision not null default 100
    check (active_power_limit_pct >= 0 and active_power_limit_pct <= 100),
  power_factor double precision not null default 1.0
    check (power_factor >= 0.80 and power_factor <= 1.0),
  export_limit_kw double precision
    check (export_limit_kw is null or export_limit_kw >= 0),
  reactive_power_mode text not null default 'off'
    check (reactive_power_mode in ('off', 'fixed_pf', 'q_u')),

  -- Invertor — praguri protecție rețea (EN 50549)
  grid_voltage_min_v double precision not null default 207
    check (grid_voltage_min_v >= 150 and grid_voltage_min_v <= 240),
  grid_voltage_max_v double precision not null default 253
    check (grid_voltage_max_v >= 240 and grid_voltage_max_v <= 300),
  grid_freq_min_hz double precision not null default 49.5
    check (grid_freq_min_hz >= 47 and grid_freq_min_hz <= 50),
  grid_freq_max_hz double precision not null default 50.5
    check (grid_freq_max_hz >= 50 and grid_freq_max_hz <= 53),

  -- Baterie
  soc_min_pct double precision not null default 20
    check (soc_min_pct >= 0 and soc_min_pct <= 100),
  soc_max_pct double precision not null default 95
    check (soc_max_pct >= 0 and soc_max_pct <= 100),
  battery_mode text not null default 'auto'
    check (battery_mode in ('auto', 'forced_charge', 'forced_discharge', 'idle')),

  -- Audit
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.device_settings enable row level security;

-- Doar utilizatorii autentificați pot citi/scrie parametrii (scrierea reală trece
-- prin server actions cu service_role, dar politica e defense-in-depth).
drop policy if exists "auth read settings" on public.device_settings;
drop policy if exists "auth write settings" on public.device_settings;
create policy "auth read settings" on public.device_settings
  for select to authenticated using (true);
create policy "auth write settings" on public.device_settings
  for all to authenticated using (true) with check (true);


-- ============================================================================
-- Funcții de agregare pentru graficele de producție (orar/săptămânal/lunar).
-- (cerință susținere — „afișare informații pe grafice orare/săptămânale/lunare/anuale")
-- Agregarea se face în DB pentru viteză (228k+ măsurători) în loc de JS.
-- ============================================================================

-- Putere medie orară (kW), însumată pe toate invertoarele — pentru vizualizare orară.
create or replace function public.production_hourly(p_hours int default 24)
returns table(bucket timestamptz, kw double precision)
language sql stable as $$
  with per_dev as (
    select date_trunc('hour', m.ts) as h, m.device_id, avg(m.ac_power_w) as w
    from public.measurements m
    join public.devices d on d.id = m.device_id and d.kind = 'inverter'
    where m.ts >= now() - make_interval(hours => p_hours)
    group by 1, 2
  )
  select h, round((sum(w) / 1000.0)::numeric, 2)::double precision
  from per_dev group by h order by h;
$$;

-- Energie zilnică (kWh) = max contor cumulativ per device per zi, însumat — pt săptămânal/lunar.
create or replace function public.production_daily(p_days int default 30)
returns table(bucket date, kwh double precision)
language sql stable as $$
  with per_dev as (
    select (m.ts at time zone 'Europe/Bucharest')::date as d, m.device_id,
           max(m.energy_today_wh) as wh
    from public.measurements m
    join public.devices d on d.id = m.device_id and d.kind = 'inverter'
    where m.ts >= now() - make_interval(days => p_days)
    group by 1, 2
  )
  select d, round((sum(wh) / 1000.0)::numeric, 1)::double precision
  from per_dev group by d order by d;
$$;

grant execute on function public.production_hourly(int) to authenticated, anon;
grant execute on function public.production_daily(int) to authenticated, anon;
