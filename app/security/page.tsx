import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Securitate · Monitor-PV',
  description: 'Implementarea măsurilor de securitate conform cap. 4.2 din lucrarea de licență.',
}

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Securitate</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Implementarea măsurilor de securitate · mapare directă cu <strong>cap. 4.2 din lucrare</strong>: „Securitate API: token / API key + HTTPS + rate limiting"
      </p>

      <Section title="1. Transport criptat (HTTPS / TLS 1.3)">
        <p>Tot traficul către aplicație este servit exclusiv prin HTTPS cu TLS 1.3, certificat managed de Vercel (Let's Encrypt cu rotație automată). Redirecționarea HTTP → HTTPS este forțată la nivel de edge.</p>
        <p className="text-xs text-zinc-500">Verificabil cu: <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">curl -I https://monitor-pv.vercel.app/</code></p>
      </Section>

      <Section title="2. Autentificare API (token / JWT)">
        <p>Acces la baza de date prin Supabase, care expune două tipuri de chei distincte:</p>
        <ul>
          <li><strong>Anon (publishable) key</strong> — embedabilă în client browser, are acces doar la operații read pe tabelele permise prin politici RLS</li>
          <li><strong>Service-role (secret) key</strong> — folosită exclusiv server-side în Vercel Functions, bypass RLS, criptată în Vercel Env Variables, niciodată trimisă către client</li>
        </ul>
        <p>Cron-ul intern (<code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">/api/cron/tick</code>) cere un Bearer secret separat (<code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">CRON_SECRET</code>) verificat la fiecare apel — Vercel îl injectează automat în header-ul Authorization la trigger-ul programat.</p>
      </Section>

      <Section title="3. Autorizare la nivel de rând (Row Level Security)">
        <p>Toate cele 5 tabele PostgreSQL (sites, devices, measurements, alarms, alarm_thresholds) au activată RLS-ul. Politici definite explicit pentru fiecare operație (read / write / delete). În varianta MVP demonstrativă, read-ul este permis anonymous, dar write-urile pot veni doar de la service-role server-side.</p>
        <p>Codul SQL al politicilor este versionat în <a href="https://github.com/Blondu2024/monitor-pv/blob/main/db/schema.sql" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">db/schema.sql</a>.</p>
      </Section>

      <Section title="4. Rate limiting și protecție DDoS">
        <p>Două straturi succesive:</p>
        <ul>
          <li><strong>Vercel Edge</strong> — limită implicită per IP / per regiune, plus mitigare DDoS L3/L4 automată via Vercel Firewall</li>
          <li><strong>Supabase PostgREST</strong> — pool de conexiuni cu limită hardcoded, plus throttling pe API-ul Management</li>
        </ul>
        <p>Pentru endpoint-urile expuse public (<code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">/api/live</code>), polling-ul client este de 5 secunde — sub orice prag de abuz natural.</p>
      </Section>

      <Section title="5. Gestionarea secretelor (Secrets Management)">
        <p>Chei API, parole DB și token-uri stocate exclusiv în Vercel Environment Variables (encrypted at rest cu AES-256 pe disk + acces doar via OIDC token la build / runtime). Nu există secrete commited în git — fișierul <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">.env.local</code> este listat explicit în <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">.gitignore</code>.</p>
      </Section>

      <Section title="6. Hardening cod sursă">
        <ul>
          <li>TypeScript strict mode activat — verificare statică tipuri la build</li>
          <li>ESLint cu reguli Next.js — detectează pattern-uri nesigure (eval, unsafe HTML, etc.)</li>
          <li>Dependențe verificate prin <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">pnpm audit</code> înainte de fiecare deploy</li>
          <li>React 19 cu protecție XSS implicită (escape automat HTML în JSX)</li>
        </ul>
      </Section>

      <Section title="7. Trasabilitate (audit log)">
        <p>Vercel logs (request, runtime, build) păstrate 7 zile pe planul actual. Supabase logs păstrate cf. politicilor lor (60 zile). Tabela <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">alarms</code> stochează istoric complet al alarmelor cu timestamps de creare / acknowledged / cleared, plus identificatorul utilizatorului care a făcut acknowledged.</p>
      </Section>

      <Section title="8. Limitări cunoscute (varianta MVP)">
        <p>În varianta demonstrativă actuală:</p>
        <ul>
          <li>Nu există autentificare la dashboard (acces public) — pentru producție se va activa Supabase Auth cu OTP email + 2FA opțional</li>
          <li>Nu există signing pe webhook-uri externe — nu există încă webhook-uri în arhitectură</li>
          <li>Telemetria către producători (Huawei FusionSolar etc.) folosește credențiale stocate per-utilizator, criptate cu key derivat la log-in (pattern Stripe-style)</li>
        </ul>
      </Section>

      <p className="text-xs text-zinc-500 italic mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        Pentru raportare vulnerabilități sau întrebări de securitate: <a href="mailto:contact@elisamitech.ro" className="underline">contact@elisamitech.ro</a>. Ne angajăm la disclosure responsabil în maxim 90 zile.
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
