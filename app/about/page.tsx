import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Despre · Monitor-PV',
  description: 'Despre platforma Monitor-PV — context, stack tehnic, surse de date.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 prose-content">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Despre Monitor-PV</h1>
      <p className="text-sm text-zinc-500 mb-8">Platformă demonstrativă de monitorizare sisteme fotovoltaice</p>

      <Section title="Context">
        <p>Monitor-PV este o platformă web pentru monitorizarea în timp real a sistemelor fotovoltaice (PV) — invertoare, contoare inteligente și baterii de stocare. Acoperă scenariul standard al unei mici centrale solare hibride (5-10 kWp) cu transmisie de date prin Modbus RS485 / TCP și interfețe API ale producătorilor.</p>
        <p>Aplicația a fost construită ca <strong>lucrare de licență</strong> pentru absolventul <strong>Profire Radu Georges Dănuț</strong>, specializarea Automatică și Informatică Aplicată, Universitatea „Dunărea de Jos" Galați, sesiunea 2026, sub coordonarea Ş.l. dr. ing. Arthur Bogdan Codreş.</p>
      </Section>

      <Section title="Ce face concret">
        <ul>
          <li>Dashboard cu KPI-uri actualizate la fiecare 5 secunde (putere instantanee, energie zi, randament, alarme)</li>
          <li>Hartă România cu site-urile monitorizate, color-coded după starea alarmelor</li>
          <li>Pagini de detaliu pentru fiecare site cu lista invertoarelor, contoarelor și bateriilor, ultima măsurătoare per device</li>
          <li>Sistem de alarme cu praguri configurabile (cf. cap. 4.5 din lucrare) și pagină dedicată per alarmă cu grafic de context</li>
          <li>API REST public pentru integrare externă</li>
        </ul>
      </Section>

      <Section title="Stack tehnic">
        <ul>
          <li><strong>Frontend</strong>: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript</li>
          <li><strong>Charts</strong>: Apache ECharts (înlocuiește Chart.js menționat în lucrare — performanță superioară pentru serii lungi)</li>
          <li><strong>Hartă</strong>: Leaflet + OpenStreetMap</li>
          <li><strong>Backend / DB</strong>: Supabase (PostgreSQL + Auth + RLS) — alternativă modernă la InfluxDB pentru time-series</li>
          <li><strong>Hosting</strong>: Vercel (serverless functions + cron)</li>
          <li><strong>Email</strong>: Resend (alarme critice)</li>
        </ul>
      </Section>

      <Section title="Sursa datelor">
        <p>Valorile istorice (30 zile orare) sunt obținute din <a href="https://re.jrc.ec.europa.eu/pvg_tools/en/" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 underline">PVGIS v5_3</a>, sistemul oficial al Joint Research Centre — Comisia Europeană, pentru coordonatele reale ale celor trei site-uri demonstrative (Galați 45.4353°N / 28.0080°E, București 44.4268°N / 26.1025°E, Cluj-Napoca 46.7712°N / 23.6236°E).</p>
        <p>Valorile „live" (refresh 5s) sunt computate sintetic din curba PVGIS pentru ora curentă cu jitter ±4%. Un cron Vercel salvează măsurători noi în baza de date la fiecare minut, pentru a putea fi verificate ulterior.</p>
        <p>Această abordare a fost validată cu comisia de examinare pe 2 iunie 2026 — sistemul e proiectat pentru integrare reală Modbus / MQTT, dar demo-ul folosește date publice pentru reproductibilitate și costuri zero hardware.</p>
      </Section>

      <Section title="Dezvoltator">
        <p><strong>ELI-SAMI-TECH S.R.L.</strong></p>
        <p>CUI 52120263 · Registrul Comerțului J2025050145008</p>
        <p>Sediu: Sector 4, București, Str. Principatele Unite nr. 38-40</p>
        <p>CAEN 6210 — Activități de realizare a soft-ului la comandă</p>
        <p className="mt-3">Contact: <a href="mailto:contact@elisamitech.ro" className="text-amber-700 dark:text-amber-400 underline">contact@elisamitech.ro</a></p>
      </Section>

      <Section title="Cod sursă">
        <p>Repository GitHub: <a href="https://github.com/Blondu2024/monitor-pv" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 underline">github.com/Blondu2024/monitor-pv</a></p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
