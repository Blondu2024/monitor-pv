import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politică de confidențialitate · Monitor-PV',
  description: 'Politica de confidențialitate Monitor-PV — GDPR și ANSPDCP.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Politică de confidențialitate</h1>
      <p className="text-sm text-zinc-500 mb-8">Ultima actualizare: 5 iunie 2026 · Conformitate GDPR / ANSPDCP</p>

      <Section title="1. Operator de date">
        <p><strong>ELI-SAMI-TECH S.R.L.</strong></p>
        <p>CUI 52120263 · Reg. Com. J2025050145008</p>
        <p>Sediu: Sector 4, București, Str. Principatele Unite nr. 38-40, parter, Bl. 18, Ap. 3(R2)</p>
        <p>Contact: <a href="mailto:contact@elisamitech.ro" className="text-amber-700 dark:text-amber-400 underline">contact@elisamitech.ro</a></p>
      </Section>

      <Section title="2. Scopul prelucrării">
        <p>Monitor-PV este o platformă <strong>demonstrativă și academică</strong>, dezvoltată ca lucrare de licență. Nu colectează date personale ale vizitatorilor. Datele afișate (producție, consum, alarme) sunt simulate din surse publice (PVGIS — JRC European Commission) și nu corespund unor instalații fizice reale.</p>
      </Section>

      <Section title="3. Date pe care le procesăm">
        <p>În utilizarea normală a site-ului:</p>
        <ul>
          <li><strong>Niciun fel de date personale</strong> nu sunt colectate, stocate sau transmise terților</li>
          <li>Nu există formulare, conturi de utilizator, cookies de tracking, pixeli analytics</li>
          <li>Singurele cookies tehnice — strict necesare funcționării (sesiune, preferințe theme)</li>
        </ul>
        <p>La nivel de infrastructură, Vercel (hosting) păstrează 7 zile log-uri tehnice cu adresa IP, user-agent și URL accesat — necesare pentru diagnostic și securitate. Aceste log-uri nu sunt analizate manual și nu sunt corelate cu identitate.</p>
      </Section>

      <Section title="4. Temei juridic">
        <p>Conform <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">Regulamentului (UE) 2016/679 (GDPR)</a>, art. 6 alin. (1) lit. f) — interes legitim al operatorului pentru diagnostic tehnic și securitate.</p>
        <p>Conform legislației române — <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">Legea nr. 190/2018</a> privind măsurile de punere în aplicare a GDPR.</p>
      </Section>

      <Section title="5. Durata stocării">
        <ul>
          <li>Log-uri Vercel: 7 zile (rotire automată)</li>
          <li>Log-uri Supabase: 60 zile (politică furnizor)</li>
          <li>Datele de demo (PVGIS): permanent — nu reprezintă date personale</li>
        </ul>
      </Section>

      <Section title="6. Transferul către terți">
        <p>Nu vindem, nu împrumutăm și nu transferăm date utilizatorilor către terți. Singurii procesatori sunt:</p>
        <ul>
          <li><strong>Vercel Inc.</strong> (SUA) — hosting; transfer pe baza standard contractual clauses (SCC)</li>
          <li><strong>Supabase Inc.</strong> (SUA) — hosting bază de date; SCC + regiune EU pe planul Free / Pro</li>
        </ul>
      </Section>

      <Section title="7. Drepturile dvs.">
        <p>Conform GDPR și Legii 190/2018, aveți dreptul:</p>
        <ul>
          <li>Să solicitați acces la datele care vă privesc</li>
          <li>Să solicitați rectificarea / ștergerea datelor</li>
          <li>Să vă opuneți prelucrării (excepție: securitate)</li>
          <li>Să primiți datele într-un format portabil</li>
          <li>Să depuneți plângere la <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">ANSPDCP</a> (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal), B-dul. G-ral. Gheorghe Magheru 28-30, Sector 1, București</li>
        </ul>
        <p>Pentru oricare dintre aceste drepturi, contactați-ne la <a href="mailto:contact@elisamitech.ro" className="text-amber-700 dark:text-amber-400 underline">contact@elisamitech.ro</a>. Răspundem în maximum 30 zile calendaristice.</p>
      </Section>

      <Section title="8. Securitate">
        <p>Aplicarea măsurilor tehnice și organizatorice descrise pe pagina <a href="/security" className="text-amber-700 dark:text-amber-400 underline">Securitate</a> — HTTPS, criptare la rest, control acces, audit logs.</p>
      </Section>

      <Section title="9. Modificări">
        <p>Această politică poate fi actualizată periodic. Versiunea curentă este afișată cu data ultimei modificări în partea de sus a paginii.</p>
      </Section>
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
