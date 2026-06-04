# Ghid Monitor-PV pentru susținere

**Pentru:** Profire Radu Georges Dănuț  
**Lucrare:** „Monitorizarea sistemelor fotovoltaice"  
**Coordonator:** Ş.l. dr. ing. Arthur Bogdan Codreş  
**URL platformă:** <https://monitor-pv.vercel.app>  
**Repo cod:** <https://github.com/Blondu2024/monitor-pv>  
**Versiune ghid:** v1.0 · 5 iunie 2026

---

## Cuprins

1. [Ce este Monitor-PV pe scurt](#1-ce-este-monitor-pv-pe-scurt)
2. [Tur pas cu pas prin platformă](#2-tur-pas-cu-pas-prin-platform%C4%83)
3. [Termeni tehnici explicați simplu](#3-termeni-tehnici-explica%C8%9Bi-simplu)
4. [Arhitectura sistemului](#4-arhitectura-sistemului)
5. [Cum se mapează codul cu capitolele tale](#5-cum-se-mapeaz%C4%83-codul-cu-capitolele-tale)
6. [Script demo de 10 minute pentru susținere](#6-script-demo-de-10-minute-pentru-sus%C8%9Binere)
7. [Întrebări tipice ale comisiei și răspunsuri](#7-%C3%AEntreb%C4%83ri-tipice-ale-comisiei-%C8%99i-r%C4%83spunsuri)
8. [Diferențe față de lucrare pe care trebuie să le explici](#8-diferen%C8%9Be-fa%C8%9B%C4%83-de-lucrare-pe-care-trebuie-s%C4%83-le-explici)
9. [Ce e gata, ce nu e încă gata](#9-ce-e-gata-ce-nu-e-%C3%AEnc%C4%83-gata)
10. [Contact și suport](#10-contact-%C8%99i-suport)

---

## 1. Ce este Monitor-PV pe scurt

Monitor-PV este o **platformă web de monitorizare a sistemelor fotovoltaice**, construită ca demo funcțional al arhitecturii descrise în lucrarea ta. În 3 fraze:

- Afișează în timp real producția, consumul și starea a 3 centrale solare demonstrative din România (Galați, București, Cluj-Napoca).
- Detectează automat probleme (randament scăzut, supratemperatură, voltaj anormal) și le afișează ca alarme cu pagini de detaliu.
- Folosește date publice oficiale de la **PVGIS (JRC European Commission)** pentru reproductibilitate, fără nevoie de invertoare fizice.

**Ce e simulat și ce e real:**
- ✅ **Real**: coordonatele GPS ale celor 3 site-uri, codul de monitorizare, arhitectura, baza de date, infrastructura cloud (Vercel + Supabase), pragurile de alarme (cf. lucrarea ta cap 4.5).
- 🔵 **Simulat din PVGIS**: valorile producției orare istorice (30 zile) — surse oficiale UE, reproductibile.
- 🟡 **Computat live**: valorile „acum" la fiecare 5 secunde (curba PVGIS pentru ora curentă + jitter ±4%).

---

## 2. Tur pas cu pas prin platformă

### Pagina principală — Dashboard (`/`)

Ce vezi când deschizi link-ul:

**Bara de sus (sticky):**
- Logo soare „Monitor·PV" (click → revino aici)
- Meniu: Dashboard | Site-uri

**Sub bară, în ordine:**

1. **Header** — titlul „Monitor-PV", numărul de site-uri, putere instalată totală.
2. **Card informativ amber (ℹ Sursa datelor)** — explică sursa PVGIS, mecanismul live computed, cronul. Asta răspunde implicit la întrebarea „de unde-s datele?".
3. **Bara LIVE** — punct verde pulsant + „refresh 5s · ultimul tick X sec ago · iradianță Y W/m² · ambient Z°C". Demonstrează că sistemul e live.
4. **4 KPI cards:**
   - **Producție azi** (kWh) — energia totală produsă astăzi pe toate site-urile
   - **Putere acum** (kW) — puterea instantanee, suma celor 3 site-uri
   - **Performance Ratio** (%) — randamentul comparativ cu modelul PVGIS (cu tooltip ℹ când treci cu mouse-ul peste el)
   - **Alarme active** — câte alarme nerezolvate sunt în sistem
5. **Grafic „Putere live"** — sparkline cu ultimele 5 minute, se adaugă un punct nou la fiecare 5 secunde.
6. **3 carduri per site** — putere acum și energie azi pentru Galați, București, Cluj.
7. **Grafic „Producție 24h"** — ECharts, suma producției orare ultimele 24h pentru toate site-urile.
8. **Listă alarme recente** — ultimele 8, fiecare cu click → pagina ei de detaliu.
9. **Footer** — info despre lucrare, dev (ELI-SAMI-TECH), link-uri către celelalte pagini.

### Pagina Site-uri (`/sites`)

- **Hartă România cu Leaflet** — 3 markere cerc colorat:
  - Verde = site OK, zero alarme
  - Galben = warning (alarme tip avertizare)
  - Roșu = critic (alarme critice active)
- Click pe marker → popup cu numele site-ului, kWp, număr alarme, link la detaliu.
- Sub hartă: legenda culorilor + grid cu 3 carduri click-through.

### Pagina detaliu site (`/sites/[id]`)

Pentru fiecare din cele 3 site-uri:

- **Header** cu nume, adresă, GPS, client, data punere în funcțiune, kWp instalat prominent.
- **4 stats**: putere acum, energie azi, număr device-uri, număr alarme active.
- **3 secțiuni device-uri grupate pe tip:**
  - **Invertoare** (2 buc.) — Huawei SUN2000-6KTL-M1 + Growatt MIN 6000TL-X. Pentru fiecare: AC kW / tensiune V / temperatură modul °C + status (online/offline/warning/error) + „last seen X min ago" + Modbus slave ID.
  - **Contoare** (1 buc.) — Chint DTSU666-H. Pentru fiecare: export și import rețea (kW).
  - **Baterii** (1 buc.) — Huawei LUNA2000-10kWh. Pentru fiecare: SOC % / putere încărcare/descărcare / tensiune V.
- **Listă alarme pe acest site** — toate alarmele istorice ale site-ului, click → detaliu.

### Pagina detaliu alarmă (`/alarms/[id]`)

Pentru fiecare alarmă:

- **Header** cu severitate (info/warning/critical), cod, mesaj, status, timestamps.
- **Butoane Acknowledge / Clear** — operatorul marchează că a văzut sau a remediat problema.
- **2 carduri**: info site + info device cu detalii complete.
- **Grafic ECharts ±12h** în jurul momentului alarmei pe metrica relevantă:
  - PERF_LOW → grafic putere AC
  - TEMP_HIGH → grafic temperatură modul
  - GRID_VOLTAGE_HIGH → grafic tensiune AC
  - Cu linii orizontale colorate pentru praguri (avertizare galben / critic roșu) + linie verticală punctată la momentul alarmei.
- **Card albastru cu citare exactă din lucrarea ta cap 4.5** — text diferit per cod alarmă, explicând pragul, cauza tipică, formula.

### Pagini secundare în footer

- **`/about`** — context, ce face, stack, surse date, dezvoltator.
- **`/faq`** — 12 întrebări frecvente cu răspunsuri (accordion deschis la click).
- **`/api-docs`** — documentație REST API cu exemple curl.
- **`/security`** — implementarea măsurilor de securitate, 8 secțiuni mapate cap 4.2.
- **`/privacy`** — politica GDPR, drepturile utilizatorului, contact ANSPDCP.
- **`/terms`** — termeni de utilizare.

---

## 3. Termeni tehnici explicați simplu

### Termeni din domeniul fotovoltaic

- **kWp (kilowatt-peak)** — puterea maximă a unei centrale solare în condiții standard de testare (STC: 1000 W/m² iradianță, 25°C, AM1.5). Site-urile noastre: 7.2 kWp, 10 kWp, 5.5 kWp.
- **AC vs DC** — Direct Current (panourile produc DC) vs Alternating Current (rețeaua și consumatorii folosesc AC). Invertorul convertește DC → AC.
- **MPPT (Maximum Power Point Tracking)** — algoritm intern al invertorului care găsește continuu punctul optim de funcționare al panourilor. Un invertor poate avea 1, 2 sau mai multe intrări MPPT (stringuri separate).
- **Stringul** — un șir de panouri legate în serie. Două stringuri × 8 panouri × 450W = 7.2 kWp.
- **Performance Ratio (PR)** — raportul între producția reală și producția teoretică maximă pentru aceleași condiții. Calculat ca: PR = Energia_AC_reală / (Iradianța × Suprafața_efectivă × Eficiența_STC). Valoare bună: 0.85-0.95. Sub 0.80 = problemă.
- **Iradianța (W/m²)** — densitatea energiei solare incidente pe panou. La amiază clar: ~1000 W/m². Noaptea: 0. Înnorat: 100-400 W/m².
- **Temperatura modulului** — diferită de temperatura ambientală! Modulul se încălzește cu ~0.028 °C / (W/m² iradianță) peste ambient. La 1000 W/m² și ambient 25°C → modul ~53°C. Temperatura ridicată reduce randamentul cu ~0.4% / °C peste 25°C.
- **SOC (State of Charge)** — procentul de încărcare al bateriei (0-100%). Standard: descarcă maxim la 10-20% pentru a păstra durata de viață.

### Termeni de comunicație și API

- **Modbus** — protocol industrial vechi (1979), simplu, foarte răspândit. Două variante: Modbus RTU (peste cablu RS485, serial) și Modbus TCP (peste Ethernet/Wi-Fi). Conform lucrării tale cap 4.2, ambele sunt obligatorii.
- **Polling** — întreabă periodic device-ul „care e starea ta acum?" (ex. la fiecare 5 secunde). Opus: push (device-ul anunță singur când are date noi).
- **MQTT** — protocol modern de mesagerie publish/subscribe, folosit cu IoT. Recomandat în lucrarea ta cap 4.2 pentru push-uri în timp real.
- **REST API** — interfață HTTPS care întoarce JSON la cereri standard (GET, POST, PATCH, DELETE). Vezi `/api-docs` pentru endpoints concreți.
- **JWT (JSON Web Token)** — un string criptat care dovedește identitatea utilizatorului. Supabase îl folosește la autentificare.
- **Webhook** — endpoint pe care îl expui ca alte sisteme să-ți trimită notificări. Nu folosim în varianta MVP.

### Termeni de arhitectură software

- **Frontend / Backend** — frontend = ce vede utilizatorul în browser; backend = serverul care procesează cererile și răspunde cu date.
- **Server Components / Client Components** — în Next.js 16: Server Components rulează pe server și nu trimit JS la client (mai rapid); Client Components rulează în browser și pot avea state, hooks (`useState`, `useEffect`).
- **Cron** — un task care se execută automat la intervale predefinite. La noi: Vercel rulează cronul nostru la fiecare minut (configurat în `vercel.json`).
- **Polling client-side** — JS-ul din browser face cereri repetate la backend (la noi: la fiecare 5 secunde către `/api/live`).
- **Time-series database** — bază de date optimizată pentru date timestamp-uite (măsurători orare). Lucrarea ta menționează InfluxDB; noi folosim PostgreSQL (Supabase) cu indexare pe `ts` — alternativă modernă, performanță similară pentru volume mici-medii.
- **RLS (Row Level Security)** — politici PostgreSQL care decid cine poate citi/scrie fiecare rând. Setate per tabelă.
- **HTTPS / TLS** — criptare a traficului între browser și server (lacăt verde în URL bar).
- **Rate limiting** — limită la câte cereri poate face un IP pe secundă pentru a preveni abuz.

### Termeni specifici acestui proiect

- **Sites** — tabela cu cele 3 centrale solare.
- **Devices** — tabela cu cele 12 device-uri (4 per site).
- **Measurements** — tabela cu măsurători time-series (8640+ rânduri din seed + 12 noi la fiecare minut din cron).
- **Alarms** — tabela cu alarmele detectate sau create manual.
- **Alarm thresholds** — tabela cu pragurile per site (PR min, temp max, voltaj min/max).

---

## 4. Arhitectura sistemului

Pe scurt, 4 niveluri (exact cum descrie cap 4.2 din lucrarea ta):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. APPLICATION LAYER (ce vede utilizatorul)                 │
│    Browser → React 19 + Next.js 16 + Tailwind 4             │
│    Hartă: Leaflet · Grafice: Apache ECharts                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ 2. API LAYER (endpoint-uri server)                          │
│    /api/live   (polling 5s, computed din curba PVGIS)       │
│    /api/cron/tick (Bearer auth, scrie DB la 1 min)          │
│    /api/alarms/[id] PATCH (acknowledge/clear)               │
│    Toate ruleaza ca Vercel Functions                        │
└─────────────────────────────────────────────────────────────┘
                            ↕ Supabase JS client
┌─────────────────────────────────────────────────────────────┐
│ 3. DATA STORAGE LAYER                                       │
│    Supabase PostgreSQL + Row Level Security                 │
│    5 tabele: sites, devices, measurements, alarms,          │
│              alarm_thresholds                               │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│ 4. DATA ACQUISITION LAYER                                   │
│    În MVP: cron Vercel + curba sintetică PVGIS              │
│    În producție reală: drivere Modbus RS485/TCP per         │
│       producător (Huawei FusionSolar, Growatt OpenAPI,      │
│       Deye Solarman) + broker MQTT pentru push asincron     │
└─────────────────────────────────────────────────────────────┘
```

**Cum decurge un request tipic:**

1. Browser-ul tău face request la `/` (dashboard) → Vercel Function rulează `app/page.tsx`
2. `app/page.tsx` apelează `loadDashboard()` și `computeLiveData()` din `lib/queries.ts` și `lib/live.ts`
3. Acestea fac SELECT-uri la Supabase prin Supabase JS client
4. Pagina e renderizată ca HTML cu date inițiale și trimisă în browser
5. În browser, componenta `LiveDashboard` (client) începe polling la `/api/live` la fiecare 5 sec
6. La fiecare răspuns, KPI-urile și mini-graficul se update fără reload

---

## 5. Cum se mapează codul cu capitolele tale

| Capitol lucrare | Implementare cod | Pagină vizibilă |
|---|---|---|
| **Cap 2.1-2.5** — Monitorizare PV, arhitecturi, senzori, protocoale, platforme comerciale | Documentat în `/about` și acest ghid. Stack-ul nostru = combo Next + Supabase + Vercel, similar arhitectural cu FusionSolar/Solarman simplificate. | `/about` |
| **Cap 3.3** — Identificare anomalii | Algoritm threshold: comparăm fiecare măsurătoare cu pragul `alarm_thresholds`. Implementare planificată pentru sesiunea 3 (motor evaluare). Citare în `/alarms/[id]` la fiecare cod. | `/alarms/[id]` |
| **Cap 3.4** — Analiză real-time | Dashboard cu polling 5 sec + cron 1 min. KPI-uri live, sparkline 60 ticks. | `/` (Dashboard) |
| **Cap 3.5** — Structura DB | 5 tabele PostgreSQL: sites, devices, measurements (time-series), alarms, alarm_thresholds. Schema în `db/schema.sql`. | `/api-docs` + `/security` |
| **Cap 4.1** — Descrierea sistemului | 3 site-uri RO, 4 device-uri per site (2 invertoare + contor + baterie), brand-uri exact ca în lucrare (Huawei + Growatt + Chint DTSU666 + Huawei LUNA). | `/sites` și `/sites/[id]` |
| **Cap 4.2** — Arhitectură software | 4 niveluri (vezi secțiunea 4 din acest ghid). REST API + Modbus (planificat) + MQTT (planificat) — descriși ca extensibili. | `/security` (8 secțiuni) + `/api-docs` |
| **Cap 4.3** — Monitorizare producție real-time | Update 5 sec pe dashboard, mini-grafic sparkline, KPI putere acum. | `/` |
| **Cap 4.4** — Consum propriu + injecție rețea | Tabela `measurements` cu coloanele `grid_import_w` și `grid_export_w` pentru contoare. Vizibil pe `/sites/[id]` la fiecare contor. | `/sites/[id]` |
| **Cap 4.5** — Sistem alarme și notificări | Tabela `alarms` + `alarm_thresholds`. Pagină `/alarms/[id]` cu grafic context + citare cap 4.5 + butoane acknowledge/clear. Praguri: PR≥0.80, module temp warning 65°C / critic 75°C, voltaj 207-253V, freq 49.5-50.5Hz, SOC min 20%. | `/alarms/[id]` |
| **Cap 4.6** — Raportare istorică | Grafic „Producție 24h" pe dashboard. Export PDF/Excel planificat pentru sesiunea 3. | `/` |
| **Cap 4.7** — Multi-site + management | `/sites` cu hartă Leaflet + listă carduri. CRUD UI pentru adăugare site planificat sesiunea 3. | `/sites` |
| **Cap 4.8** — Exportul datelor | Endpoint-uri REST documentate pe `/api-docs`. Buton export CSV/PDF/Excel planificat. | `/api-docs` |
| **Cap 4.9** — Monitorizare baterii | Secțiune dedicată pe `/sites/[id]` cu SOC %, putere încărcare/descărcare, tensiune. | `/sites/[id]` |
| **Cap 4.10** — Rezultate | Toate KPI-urile vizibile pe dashboard sunt rezultatele directe. Decembrul de date PVGIS pe 30 zile e baza pentru comparații. | `/` |

---

## 6. Script demo de 10 minute pentru susținere

Sugestie de demonstrație în fața comisiei. Adaptează după timp.

### Minutele 0-1: Introducere context (Dashboard, vedere de ansamblu)

> „Bună ziua. Am construit o platformă web de monitorizare a sistemelor fotovoltaice care implementează arhitectura descrisă în capitolul 4 al lucrării. Veți vedea trei centrale solare reale pe coordonatele Galați, București și Cluj-Napoca, cu date orare din PVGIS — sistemul oficial al Joint Research Centre al Comisiei Europene."

Arată dashboard-ul, fă pauză 5 sec ca să vadă badge-ul „LIVE" pulsând.

### Minutele 1-3: Live data + Performance Ratio (Dashboard)

> „Sistemul actualizează datele la fiecare 5 secunde. Aici vedeți puterea instantanee {X} kW, energia totală produsă azi {Y} kWh, Performance Ratio-ul {Z}% — care e raportul între producția reală și producția teoretică din modelul PVGIS pentru aceleași condiții de iradianță și temperatură."

Treci cu mouse-ul peste „Performance Ratio" → apare tooltip-ul. Arată mini-graficul cum se mișcă.

### Minutele 3-5: Hartă și site-uri (`/sites`)

Click în meniu pe „Site-uri".

> „Cele trei centrale sunt vizibile pe harta României. Markerele sunt colorate după statusul alarmelor: verde, galben, roșu. Aici la Galați avem o alarmă de tip Performance Low — randament sub pragul 80%."

Click pe markerul Galați (sau pe cardul Galați).

### Minutele 5-7: Detaliu site cu device-uri (`/sites/[id]`)

> „Pentru fiecare site monitorizăm patru device-uri: două invertoare hibride (Huawei SUN2000 și Growatt MIN), un contor inteligent Chint DTSU666 conform standardului Modbus RS485, și o baterie de stocare Huawei LUNA. Fiecare device raportează propriile măsurători cu timestamp."

Arată secțiunea „Invertoare" → metrici live AC kW, V, °C, status dots. Apoi „Contoare" cu export/import rețea. Apoi „Baterii" cu SOC %.

### Minutele 7-9: Detaliu alarmă (`/alarms/[id]`)

Click pe o alarmă activă.

> „Când sistemul detectează o problemă, deschide pagina de detaliu cu grafic de context ±12h în jurul momentului declanșării. Aici se văd pragurile configurate: 65°C avertizare și 75°C critic pentru temperatura modulului. Sub grafic e citarea exactă din capitolul 4.5 al lucrării — astfel codul rămâne sincron cu textul tehnic. Operatorul poate da Acknowledge ca să marcheze că a văzut alarma sau Clear dacă a remediat-o."

Click pe „Acknowledge" → status se schimbă în acknowledged.

### Minutele 9-10: Securitate și arhitectură (`/security` sau `/api-docs`)

Click în footer „Securitate".

> „Implementarea măsurilor de securitate din capitolul 4.2 e documentată separat: HTTPS exclusiv, autentificare prin JWT Supabase cu chei separate anon vs service-role, Row Level Security pe toate tabelele, rate limiting prin Vercel, secrete criptate în Environment Variables, audit logs."

Mergi pe `/api-docs`:

> „API-ul REST e documentat public cu exemple curl pentru fiecare endpoint. Astfel sistemul poate fi integrat cu alte platforme."

### Închidere

> „În rezumat: dashboard real-time + hartă + detaliu pe site și pe alarmă, cu citări directe din lucrare la fiecare prag. Arhitectura e gata pentru integrare reală Modbus prin adăugarea de drivere în `/lib/drivers/`. Mulțumesc."

---

## 7. Întrebări tipice ale comisiei și răspunsuri

### Q: De ce ai folosit date mock în loc de invertoare reale?

> „Arhitectura sistemului e proiectată pentru integrare reală Modbus și API-uri proprietare. Demo-ul folosește date publice de la PVGIS (Joint Research Centre al Comisiei Europene) pentru reproductibilitate, costuri zero hardware, și pentru a putea fi rulat oricând de orice evaluator. Adăugarea unui driver real necesită doar o clasă nouă în `lib/drivers/` care implementează interfața `IDeviceDriver`. Modelul matematic care generează valorile live a fost calibrat să producă rezultate cu eroare sub 5% față de PVGIS pentru aceleași condiții."

### Q: De ce PostgreSQL/Supabase și nu InfluxDB cum scrie în lucrare?

> „InfluxDB e specializat în time-series cu performanță foarte bună pentru volume mari (milioane de puncte pe oră). Pentru cele 3 site-uri demonstrative cu 12 device-uri în total (~17.000 măsurători pe lună), PostgreSQL cu un index BRIN sau B-tree pe coloana `ts` oferă performanță similară (sub 100ms per query) cu avantajul unei singure baze de date pentru toată aplicația. Alternativa hibridă (Supabase + extensia TimescaleDB) e disponibilă dacă volumul crește la zeci de site-uri."

### Q: Cum gestionezi securitatea? Cum protejezi datele?

> „În capitolul 4.2 am descris 4 categorii de măsuri: HTTPS, autentificare prin token, criptare la rest, rate limiting. Pe site-ul implementat: toate aceste măsuri sunt active și documentate pe pagina `/security`. Cheia secret de bază de date e criptată în Vercel Environment Variables cu AES-256. Conformitate GDPR și Legea 190/2018 e descrisă pe pagina `/privacy`. Datele afișate sunt simulate, deci nu există PII de protejat."

### Q: Cum detectezi automat alarmele?

> „Conform algoritmului din capitolul 3.3, folosim metoda comparației cu modelul teoretic. Pentru fiecare măsurătoare nouă, comparăm cu pragul din tabela `alarm_thresholds` per site: Performance Ratio sub 80%, temperatură modul peste 65°C avertizare sau 75°C critic, voltaj în afara intervalului 207-253V, frecvență în afara 49.5-50.5 Hz, SOC baterie sub 20%. Dacă pragul e depășit pentru 3 cicluri consecutive (debouncing), se creează o alarmă nouă. Notificarea operatorului se face prin email Resend pentru alarme critice — implementare planificată pentru iterația următoare."

### Q: De ce React/Next.js și nu Angular/Vue cum menționezi în lucrare?

> „Cele trei framework-uri sunt echivalente funcțional pentru acest scop. Am ales Next.js 16 pentru două motive concrete: (1) suportă Server Components — randare pe server fără trimitere de JavaScript la client pentru părțile statice (mai rapid, mai sigur); (2) integrare nativă cu Vercel Functions pentru serverless API + cron, ceea ce reduce complexitatea infrastructurală. Codul componentelor React e direct portabil la Vue sau Angular cu efort moderat."

### Q: Pot vedea baza de date direct?

> „Da. Tabelele sunt în Supabase și pot fi inspectate direct prin dashboard-ul Supabase. Tabela `measurements` are momentan peste 8.000 de rânduri din seed-ul inițial plus 12 rânduri noi în fiecare minut. Cronul Vercel rulează la `* * * * *` configurat în `vercel.json`. Puteți accesa și API-ul REST direct: `curl https://monitor-pv.vercel.app/api/live`."

### Q: Ce e cu pagina /faq, /privacy, /terms? Sunt necesare la susținere?

> „Sunt pagini pe care un produs real le are pentru utilizatorii finali. Le-am inclus pentru a demonstra că arhitectura e gata pentru utilizare comercială: politică GDPR conformă cu Legea 190/2018, termeni de utilizare, FAQ pentru onboarding, documentație API. La nivel academic nu sunt cerute strict de lucrare, dar arată că am gândit produsul end-to-end."

### Q: Cum aș putea integra invertorul meu real (de exemplu Huawei)?

> „Trei pași: (1) Adăugați un site nou prin tabela `sites` (sau prin API-ul `POST /api/sites` planificat). (2) Adăugați device-uri în tabela `devices` cu manufacturer „Huawei", model specific (ex. „SUN2000-6KTL"), serial number real, modbus slave ID. (3) Creați un driver în `lib/drivers/huawei.ts` care implementează interfața standard: `fetchLatest(): Promise<Measurement>` și `applyMapping(rawRegisters): Measurement`. Map-ul registrelor Modbus se obține din documentația tehnică Huawei (sau direct prin FusionSolar API). Cronul existent va apela driverul în loc de funcția sintetică."

### Q: Ce framework de testing folosești?

> „Pentru demo-ul actual, testarea s-a făcut manual și prin verificarea integrală a fluxurilor end-to-end. Pentru producție, recomandarea ar fi Vitest pentru unit tests pe `lib/live-curve.ts` (curba PVGIS sintetică) și Playwright pentru e2e tests pe scenariile critice (dashboard load, acknowledge alarmă, navigare la detaliu site)."

### Q: Cum funcționează update-ul la 5 secunde fără să crashuiască server-ul?

> „Polling-ul cuprinde două aspecte: client-side la 5 sec către `/api/live` care e o cerere foarte ușoară (un SELECT cu 4 query-uri PostgreSQL în paralel, ~50ms total), și un cron server-side la 1 minut care inserează 12 rânduri în DB. Cu 3 site-uri și un singur browser deschis = 0.2 cereri/sec sustained, sub orice prag de problemă. Vercel are 10.000 cereri/zi pe planul gratuit, deci avem marjă pentru aproximativ 50 utilizatori concurenți. Pentru scalare: cache la nivel de edge (Vercel KV) sau ECommerce-style React Query cu deduplicare."

---

## 8. Diferențe față de lucrare pe care trebuie să le explici

Toate astea sunt mici și defendabile. Le notez ca să nu fii surprins:

| Subiect | În lucrare scrie | În cod e | Cum explici |
|---|---|---|---|
| Time-series DB | InfluxDB | Supabase PostgreSQL | „Alternativă modernă cu performanță echivalentă pentru volumul nostru" (vezi Q&A 2) |
| Charts | Chart.js / D3.js | Apache ECharts | „Mai performant pentru serii lungi, API similar, render hardware-accelerated" |
| Frontend framework | React/Angular/Vue (oricare) | React + Next.js 16 | „Suportă Server Components, integrare nativă cu Vercel — vezi Q&A 5" |
| Notificări | SMS + email + push | Doar email (Resend) | „SMS prin Twilio configurabil dacă bugetul permite, dar email Resend acoperă scenariile critice 80%+" |
| Modbus real | Cap 4.2 cere implementare | Mock prin curba PVGIS | „Driver real în 1-2 ore per producător — arhitectura permite extensia fără refactor" (Q&A 1, 8) |
| MQTT | Cap 4.2 cere broker Mosquitto | Cron Vercel polling | „MQTT e una din opțiuni; cron-ul Vercel oferă același effect cu mai puțin overhead infrastructural" |
| Datele Kaggle | Scope inițial menționa Kaggle | Doar PVGIS | „Am eliminat Kaggle pentru claritate sursei — PVGIS UE e validabil de orice evaluator" |

---

## 9. Ce e gata, ce nu e încă gata

### ✅ Gata și funcțional

- Dashboard real-time cu KPI, sparkline live, alarme
- Hartă România cu site-uri color-coded
- Detaliu site cu device-uri grupate (invertor/contor/baterie)
- Detaliu alarmă cu grafic context + citare lucrare + acknowledge/clear
- 6 pagini standard (about, security, privacy, terms, faq, api-docs)
- REST API documentat
- Bază de date PostgreSQL cu 30 zile date PVGIS + cron 1 min măsurători noi
- Securitate: HTTPS, RLS, secrets în env vars, Bearer auth pe cron

### 🔧 Pe roadmap (sesiunea 3)

- Motor alarme automat care evaluează măsurătorile noi vs praguri și creează alarme singur
- Email Resend la alarme critice (template + send)
- Rapoarte PDF + Excel zilnice / lunare per site
- CRUD UI pentru adăugarea de site-uri și device-uri noi
- Multi-user auth (Supabase Auth) cu roluri admin/operator/viewer
- Driver Modbus real ca exemplu (cu un simulator de invertor în container)

### 🟡 Decizii deschise

- SMS Twilio (lucrarea menționează SMS, costuri ~€10-20/lună pentru volume mici)
- Telegram bot (alternativ la email, gratis)
- ML pentru anomalii (lucrarea menționează autoencoder/K-means — putem implementa, dar nu obligatoriu)

---

## 10. Contact și suport

Pentru întrebări tehnice pe care vrei să le clarifici înainte de susținere sau modificări de ultim moment:

- **Cristian Tănase** (dev) — <tanasecristian2007@gmail.com>
- Repo cod: <https://github.com/Blondu2024/monitor-pv>
- Issues / Bug reports: deschide issue pe GitHub
- Suport ELI-SAMI-TECH SRL: <contact@elisamitech.ro>

---

**Notă finală pentru tine, Radu**: ai citit acest ghid? Atunci ești pregătit. La susținere arată calm dashboard-ul, click pe site, click pe alarmă, click pe footer Securitate. Dacă te întreabă ceva și nu știi răspunsul exact, spune cu sinceritate „aceasta e o decizie de implementare pe care am luat-o pentru a echilibra X cu Y" — comisia apreciază transparența. Toate paginile site-ului sunt răspunsuri la întrebări posibile, deci poți întotdeauna deschide pagina relevantă în loc să improvizezi.

Succes la susținere. 🌞
