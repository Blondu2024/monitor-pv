import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/about', label: 'Despre' },
  { href: '/faq', label: 'FAQ' },
  { href: '/api-docs', label: 'API' },
  { href: '/security', label: 'Securitate' },
  { href: '/privacy', label: 'Confidențialitate' },
  { href: '/terms', label: 'Termeni' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-zinc-500">
        <div className="md:col-span-2">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Monitor-PV</h3>
          <p>Platformă demonstrativă de monitorizare sisteme fotovoltaice — invertoare, contoare, baterii cu transmisie Modbus / API.</p>
          <p className="mt-2">Sursă date: <a href="https://re.jrc.ec.europa.eu/pvg_tools/en/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">PVGIS v5_3 (JRC European Commission)</a> + simulare live computed.</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Lucrare licență</h3>
          <p><span className="font-medium text-zinc-700 dark:text-zinc-300">„Monitorizarea sistemelor fotovoltaice"</span></p>
          <p className="mt-1">Absolvent: Profire Radu Georges Dănuț</p>
          <p>Automatică și Informatică Aplicată</p>
          <p>Coordonator: Ş.l. dr. ing. Arthur Bogdan Codreş</p>
          <p>Universitatea „Dunărea de Jos" Galați, 2026</p>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Dezvoltat de</h3>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">ELI-SAMI-TECH S.R.L.</p>
          <p>CUI 52120263</p>
          <p>Reg. Com. J2025050145008</p>
          <p>Sector 4, București · CAEN 6210</p>
          <p className="mt-2"><a href="mailto:contact@elisamitech.ro" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">contact@elisamitech.ro</a></p>
        </div>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-zinc-500">
          <p>© 2026 ELI-SAMI-TECH S.R.L. · Datele simulate exclusiv în scop demonstrativ și academic — nu reprezintă măsurători reale.</p>
          <p>Made in 🇷🇴 · <a href="https://github.com/Blondu2024/monitor-pv" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">Open source pe GitHub</a></p>
        </div>
      </div>
    </footer>
  )
}
