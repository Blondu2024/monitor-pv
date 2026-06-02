# Monitor-PV

Platformă de monitorizare a sistemelor fotovoltaice — proiect de licență (Profire Radu, susținere ~16 iunie 2026).

Date publice (PVGIS — JRC European Commission + dataset Kaggle solar), fără hardware real. Arhitectura include un strat de drivere extensibil care permite integrarea reală Modbus/MQTT ulterior.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind
- **Supabase** (Postgres + Auth + Realtime)
- **Apache ECharts** pentru grafice, **Leaflet** pentru hartă
- **PVGIS** pentru date de producție realiste per locație
- Deploy: **Vercel** (subdomain gratis)

## Setup local

```powershell
pnpm install
Copy-Item .env.local.example .env.local
# Completează cheile Supabase + Resend în .env.local
pnpm dev
```

## Schema DB

Rulează `db/schema.sql` în Supabase SQL Editor după ce ai creat proiectul.

## Surse de date

- **PVGIS** (`re.jrc.ec.europa.eu/api/v5_3/seriescalc`) — producție orară per lat/lng. Fără API key. Utilizat pentru baseline „producție estimată" în algoritmul de anomalie din lucrare cap 4.5.
- **Kaggle Solar Power Generation Data** — 34 zile reale 2 plant-uri solare, măsurători 15 min/invertor cu senzori (irradiance, ambient temp, module temp). Folosit pentru istoric per device.

## Praguri alarme (din lucrarea Radu, cap 4.5)

- Randament minim: 80% din producția estimată PVGIS
- Temperatură modul: 65°C warning / 75°C critic
- Voltaj: 220-240V ±10%, frecvență 49.5-50.5Hz
- Timeout offline: 60s default (10-30s rapid, 1-5min standard)
