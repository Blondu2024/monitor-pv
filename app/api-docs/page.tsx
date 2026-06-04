import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API · Monitor-PV',
  description: 'Documentație API-uri Monitor-PV — REST endpoints, autentificare, exemple.',
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">API Reference</h1>
      <p className="text-sm text-zinc-500 mb-8">REST endpoints expuse de Monitor-PV. Conformitate cu <strong>cap. 4.2</strong> din lucrare — „REST API + HTTPS + token".</p>

      <Section title="Convenții">
        <ul>
          <li><strong>Base URL</strong>: <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">https://monitor-pv.vercel.app</code></li>
          <li><strong>Format</strong>: JSON (request + response)</li>
          <li><strong>Encoding</strong>: UTF-8</li>
          <li><strong>Auth</strong>: Bearer token în header <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Authorization</code> pentru endpoint-urile protejate</li>
          <li><strong>Rate limit</strong>: vezi <a href="/security" className="text-amber-700 dark:text-amber-400 underline">/security</a> — implicit prin Vercel Edge</li>
        </ul>
      </Section>

      <Endpoint method="GET" path="/api/live" auth="Public">
        <p>Întoarce starea curentă agregată a tuturor site-urilor — valori live computate din curba PVGIS pentru ora curentă + jitter.</p>
        <CodeBlock title="Exemplu request">
{`curl https://monitor-pv.vercel.app/api/live`}
        </CodeBlock>
        <CodeBlock title="Exemplu response (200 OK)">
{`{
  "now": 1717612345678,
  "totalPowerKw": 12.4,
  "totalEnergyTodayKwh": 87.3,
  "performanceRatioPct": 89,
  "activeAlarms": 2,
  "irradianceWm2": 624,
  "ambientTempC": 27.4,
  "perSite": [
    {
      "id": "942bcd55-4495-4bbb-b2a8-1939ad348b43",
      "name": "Galați — Centrala PV Demonstrativă 1",
      "powerKw": 4.1,
      "energyKwh": 28.5,
      "peakKwp": 7.2
    },
    {
      "id": "c65acde3-9dbb-44ad-af26-063635d71ff8",
      "name": "București — Hală Industrială PV-2",
      "powerKw": 5.7,
      "energyKwh": 38.2,
      "peakKwp": 10
    },
    {
      "id": "23ab7782-6d24-4eff-aa6f-53735a2d9736",
      "name": "Cluj — Centrală Acoperiș PV-3",
      "powerKw": 2.6,
      "energyKwh": 20.6,
      "peakKwp": 5.5
    }
  ]
}`}
        </CodeBlock>
      </Endpoint>

      <Endpoint method="PATCH" path="/api/alarms/{id}" auth="Public (MVP) → token în producție">
        <p>Actualizează statusul unei alarme — acknowledge sau clear.</p>
        <CodeBlock title="Body schema (JSON)">
{`{
  "action": "acknowledge" | "clear"
}`}
        </CodeBlock>
        <CodeBlock title="Exemplu request">
{`curl -X PATCH \\
  https://monitor-pv.vercel.app/api/alarms/62a39640-b4ce-4d5a-8e8d-16f1bcb21425 \\
  -H "Content-Type: application/json" \\
  -d '{"action":"acknowledge"}'`}
        </CodeBlock>
        <CodeBlock title="Exemplu response (200 OK)">
{`{
  "ok": true,
  "alarm": {
    "id": "62a39640-b4ce-4d5a-8e8d-16f1bcb21425",
    "status": "acknowledged"
  }
}`}
        </CodeBlock>
        <CodeBlock title="Errors">
{`400 invalid action     // body lipsă sau action != acknowledge | clear
404 alarm not found    // ID invalid
500 server error       // problemă DB`}
        </CodeBlock>
      </Endpoint>

      <Endpoint method="GET" path="/api/cron/tick" auth="Bearer CRON_SECRET">
        <p>Endpoint intern, apelat de cron-ul Vercel la fiecare minut. Generează măsurători sintetice pentru toate device-urile (12 rows/site × 3 site-uri) și le inserează în baza de date.</p>
        <p className="text-xs text-zinc-500">NU este destinat apelării manuale — apelarea fără Bearer corect = 401 Unauthorized.</p>
        <CodeBlock title="Header requis">
{`Authorization: Bearer <CRON_SECRET>`}
        </CodeBlock>
        <CodeBlock title="Exemplu response (200 OK)">
{`{
  "ok": true,
  "inserted": 12,
  "ts": "2026-06-05T08:42:00.123Z"
}`}
        </CodeBlock>
      </Endpoint>

      <Section title="Endpoint-uri planificate (roadmap)">
        <ul>
          <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /api/sites</code> — listă completă site-uri</li>
          <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /api/sites/{`{id}`}/devices</code> — device-uri per site</li>
          <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /api/measurements?device_id=X&from=...</code> — istoric per device</li>
          <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">POST /api/sites</code> — creare site nou (cap. 4.7)</li>
          <li><code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">GET /api/reports/daily?site_id=X&date=...</code> — raport zilnic PDF/Excel (cap. 4.8)</li>
        </ul>
      </Section>

      <p className="text-xs text-zinc-500 italic mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        Cere acces extins (write, integrare): <a href="mailto:contact@elisamitech.ro" className="underline">contact@elisamitech.ro</a>
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold mb-3 text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function Endpoint({ method, path, auth, children }: { method: string; path: string; auth: string; children: React.ReactNode }) {
  const methodColor: Record<string, string> = {
    GET: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    POST: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    PATCH: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    DELETE: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  }
  return (
    <section className="mb-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2 py-1 rounded ${methodColor[method] ?? 'bg-zinc-100 dark:bg-zinc-800'}`}>{method}</span>
        <code className="text-sm font-mono font-semibold">{path}</code>
        <span className="text-xs text-zinc-500 ml-auto">Auth: {auth}</span>
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3">{children}</div>
    </section>
  )
}

function CodeBlock({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500 mt-3 mb-1">{title}</p>
      <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">{children}</pre>
    </div>
  )
}
