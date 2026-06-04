import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termeni și condiții · Monitor-PV',
  description: 'Termenii și condițiile de utilizare ale platformei Monitor-PV.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Termeni și condiții</h1>
      <p className="text-sm text-zinc-500 mb-8">Ultima actualizare: 5 iunie 2026</p>

      <Section title="1. Acceptare">
        <p>Prin accesarea platformei Monitor-PV (<a href="https://monitor-pv.vercel.app" className="text-amber-700 dark:text-amber-400 underline">https://monitor-pv.vercel.app</a>), confirmați că ați citit, înțeles și acceptat termenii de mai jos.</p>
      </Section>

      <Section title="2. Scop și natura serviciului">
        <p>Monitor-PV este o platformă <strong>demonstrativă și academică</strong>, dezvoltată ca parte a lucrării de licență a absolventului Profire Radu Georges Dănuț. Toate datele afișate sunt simulate din surse publice (PVGIS, JRC European Commission) și nu reprezintă măsurători reale de la instalații fizice.</p>
        <p>Platforma <strong>nu este un produs comercial</strong> și nu garantează acuratețe pentru utilizare în decizii operaționale reale.</p>
      </Section>

      <Section title="3. Limitarea răspunderii">
        <p>ELI-SAMI-TECH S.R.L., autorul codului sursă, și Profire Radu Georges Dănuț, beneficiarul academic, nu garantează:</p>
        <ul>
          <li>Disponibilitate continuă a serviciului (best-effort, dependent de Vercel + Supabase)</li>
          <li>Acuratețea datelor simulate vs. instalații reale</li>
          <li>Compatibilitate cu sisteme externe sau dispozitive Modbus reale</li>
          <li>Adecvarea pentru un scop comercial sau de producție</li>
        </ul>
        <p>În măsura permisă de lege, răspunderea oricăruia dintre părți este limitată la 0 (zero) EUR pentru utilizarea acestei platforme demonstrative.</p>
      </Section>

      <Section title="4. Utilizare permisă">
        <p>Aveți permisiunea să:</p>
        <ul>
          <li>Vizualizați conținutul platformei pentru scop personal, educațional sau de evaluare</li>
          <li>Citați platforma în lucrări academice cu atribuire corectă</li>
          <li>Studiați codul sursă <a href="https://github.com/Blondu2024/monitor-pv" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">disponibil public pe GitHub</a> sub licență MIT</li>
        </ul>
        <p>Nu aveți permisiunea să:</p>
        <ul>
          <li>Folosiți platforma pentru a lua decizii operaționale asupra instalațiilor PV reale fără validare independentă</li>
          <li>Reverse-engineering al cheilor API pentru a accesa endpoint-uri protejate</li>
          <li>Atacuri DoS, scraping masiv, sau orice abuz al resurselor (vezi <a href="/security" className="text-amber-700 dark:text-amber-400 underline">Securitate</a> pentru rate limits)</li>
        </ul>
      </Section>

      <Section title="5. Proprietate intelectuală">
        <p>Codul sursă: licență <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener" className="text-amber-700 dark:text-amber-400 underline">MIT</a> · © 2026 ELI-SAMI-TECH S.R.L.</p>
        <p>Conținut editorial (texte, descrieri, articole): © 2026 Profire Radu Georges Dănuț · ELI-SAMI-TECH S.R.L. — toate drepturile rezervate. Citarea cu atribuire este permisă.</p>
        <p>Date PVGIS: © European Union 2001-2026, JRC — disponibile sub licența standard PVGIS.</p>
      </Section>

      <Section title="6. Modificări ale termenilor">
        <p>Ne rezervăm dreptul de a actualiza acești termeni. Modificările intră în vigoare la momentul publicării cu data ultimei modificări actualizată. Utilizarea continuă a platformei după modificare = acceptare implicită.</p>
      </Section>

      <Section title="7. Lege aplicabilă și jurisdicție">
        <p>Acești termeni sunt guvernați de legislația română. Orice dispută va fi rezolvată prioritar prin negociere amiabilă; în caz contrar, instanțele competente sunt cele din București, sector 4.</p>
      </Section>

      <Section title="8. Contact">
        <p>Întrebări despre acești termeni: <a href="mailto:contact@elisamitech.ro" className="text-amber-700 dark:text-amber-400 underline">contact@elisamitech.ro</a></p>
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
