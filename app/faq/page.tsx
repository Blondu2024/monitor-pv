import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Întrebări frecvente · Monitor-PV',
  description: 'Răspunsuri la întrebările frecvente despre platforma Monitor-PV.',
}

const FAQ = [
  {
    q: 'Ce înseamnă „Performance Ratio" pe dashboard?',
    a: 'Performance Ratio (PR) este raportul între producția reală a sistemului și producția estimată din modelul PVGIS pentru aceleași condiții (iradianță, temperatură, geometrie panouri). Un PR de 85-95% e tipic pentru sisteme sănătoase. Sub 80% indică o problemă: murdărie panouri, umbrire parțială, defect string, MPPT sub-optimal.',
  },
  {
    q: 'De ce văd 0 kW noaptea?',
    a: 'Producția fotovoltaică este 0 între apusul și răsăritul soarelui. Pentru România, în iunie sunsetul este în jurul orei 21:00 și răsăritul la 5:30 (ora locală). Performance Ratio nu poate fi calculat fără iradianță, deci apare „—" în dashboard noaptea. Aceasta este comportament corect.',
  },
  {
    q: 'Cum se actualizează datele?',
    a: 'Două mecanisme paralele: (1) clientul tău polling endpoint-ul /api/live la fiecare 5 secunde și actualizează KPI-urile + mini-graficul; (2) un cron Vercel rulează la fiecare minut și inserează măsurători noi în baza de date pentru toate device-urile. Graficul „Producție 24h" reflectă istoricul din baza de date și se completează minut cu minut.',
  },
  {
    q: 'Cum reacționez la o alarmă critică?',
    a: 'Click pe alarmă din lista de pe dashboard → se deschide pagina de detaliu cu un grafic de context ±12h în jurul momentului alarmei și pragurile relevante (linie roșie / galbenă). Citește citarea din lucrare pentru cauzele tipice. Apasă butonul „Acknowledge" pentru a marca faptul că ai văzut alarma, sau „Clear" dacă problema a fost remediată. Statusul rămâne istoric în baza de date pentru audit.',
  },
  {
    q: 'Ce înseamnă status-urile invertoarelor (online / offline / warning / error)?',
    a: 'Online = device-ul răspunde la polling Modbus în timp util. Warning = răspunde dar a depășit un prag de avertizare (ex. temperatură 65°C). Error = răspunde dar raportează cod de eroare propriu (ex. „grid disconnected"). Offline = nu mai răspunde la cereri timp de peste 60 secunde — vezi pagina /security pentru detalii pe heartbeat.',
  },
  {
    q: 'Pot adăuga propriul meu invertor / site?',
    a: 'În varianta demonstrativă actuală, site-urile și device-urile sunt seed-ate static (3 site-uri RO × 4 device-uri). CRUD-ul UI pentru adăugare manuală este pe roadmap (cap. 4.7 din lucrare). Pentru integrare reală cu invertor fizic (Huawei FusionSolar / Growatt ShinePhone / Deye Solarman), este nevoie de credențiale API ale producătorului și extindere prin clasa Driver din /lib/drivers/ — vezi /api pentru schema.',
  },
  {
    q: 'De ce datele sunt din 2023 (PVGIS) și nu din 2026?',
    a: 'PVGIS publică date validate cu întârziere de 1-2 ani. Anul 2023 e cel mai recent complet disponibil în API-ul v5_3. Script-ul nostru de seed shifteaza timestamp-urile orare ca să se termine la „acum" — astfel intervalul vizibil e 30 zile încheiate la ora curentă. Pattern-ul solar e identic an cu an pentru aceeași zonă geografică, deci credibilitatea fizică e păstrată.',
  },
  {
    q: 'Cum sunt detectate automat alarmele?',
    a: 'Motorul de evaluare (în roadmap pentru sesiunea următoare) va compara fiecare măsurătoare nouă cu pragurile configurate per site (tabela alarm_thresholds): PR < 80%, module_temp > 65°C, voltaj în afară 207-253V, etc. La depășire de 3 cicluri consecutive, se creează automat o alarmă în tabela alarms. Vezi cap. 3.3 din lucrare pentru algoritmul de threshold și comparație cu estimat PVGIS.',
  },
  {
    q: 'Ce protocoale de comunicație sunt suportate?',
    a: 'Arhitectura suportă Modbus TCP/RTU (peste RS485 pentru contoare, peste TCP pentru invertoare în rețea), MQTT (broker Mosquitto pentru push asincron), și API-uri proprietare ale producătorilor (Huawei FusionSolar, Growatt OpenAPI, Deye Solarman, Sungrow iSolarCloud) — cf. cap. 4.2 din lucrare. În MVP-ul demo, doar polling-ul sintetic e activ.',
  },
  {
    q: 'Datele de demo provin din India (Kaggle)?',
    a: 'Nu — folosim exclusiv PVGIS (Joint Research Centre, Comisia Europeană) pentru coordonatele reale ale celor 3 site-uri din România. Lipsește dependența de dataset-ul Kaggle „Solar Power Generation Data" menționat în scope-ul inițial. Toate valorile sunt fizic plauzibile pentru clima RO și pot fi validate prin comparație directă cu site-ul PVGIS.',
  },
  {
    q: 'Pot integra cu sistemele mele existente prin API?',
    a: 'Da — endpoint-urile REST sunt documentate pe pagina /api. GET /api/live întoarce starea curentă în JSON. Pentru integrare profundă (adăugare site-uri, scriere măsurători personalizate), este necesar un Bearer secret — contactați-ne pentru parteneriate.',
  },
  {
    q: 'Cine deține drepturile asupra codului?',
    a: 'Codul sursă este publicat sub licența MIT pe GitHub (Blondu2024/monitor-pv), dezvoltat de ELI-SAMI-TECH S.R.L. (CUI 52120263). Conținutul editorial (texte, descrieri, structura lucrării) aparține Profire Radu Georges Dănuț în context academic. Datele de demo sunt © European Union (JRC PVGIS).',
  },
]

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Întrebări frecvente</h1>
      <p className="text-sm text-zinc-500 mb-8">Răspunsuri scurte la cele mai comune întrebări despre platformă.</p>

      <div className="flex flex-col gap-3">
        {FAQ.map((item, i) => (
          <details key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start justify-between gap-3">
              <span className="flex-1">{item.q}</span>
              <span className="text-zinc-400 group-open:rotate-180 transition-transform shrink-0">▾</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <p className="text-xs text-zinc-500 italic mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-4">
        Nu ai găsit răspunsul? Întreabă-ne la <a href="mailto:contact@elisamitech.ro" className="underline">contact@elisamitech.ro</a> și actualizăm pagina.
      </p>
    </div>
  )
}
