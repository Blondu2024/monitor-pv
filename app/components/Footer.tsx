export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-500">
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Monitor-PV</h3>
          <p>Platformă demonstrativă de monitorizare sisteme fotovoltaice — invertoare, contoare, baterii cu transmisie Modbus / API.</p>
          <p className="mt-2">Sursă date: <a href="https://re.jrc.ec.europa.eu/pvg_tools/en/" target="_blank" rel="noopener" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">PVGIS v5_3 (JRC European Commission)</a> + simulare live computed.</p>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Lucrare licență</h3>
          <p><span className="font-medium text-zinc-700 dark:text-zinc-300">„Monitorizarea sistemelor fotovoltaice"</span></p>
          <p className="mt-1">Absolvent: Profire Radu Georges Dănuț</p>
          <p>Specializarea: Automatică și Informatică Aplicată</p>
          <p>Coordonator: Ş.l. dr. ing. Arthur Bogdan Codreş</p>
          <p>Universitatea „Dunărea de Jos" Galați, 2026</p>
        </div>
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Dezvoltat de</h3>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">ELI-SAMI-TECH S.R.L.</p>
          <p>CUI 52120263 · Reg. Com. J2025050145008</p>
          <p>Sector 4, București · CAEN 6210</p>
          <p className="mt-2">Datele afișate sunt simulate exclusiv în scop demonstrativ și academic. Nu reprezintă măsurători reale de la instalații fizice.</p>
        </div>
      </div>
    </footer>
  )
}
