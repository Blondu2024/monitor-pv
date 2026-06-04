import { promises as fs } from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const metadata: Metadata = {
  title: 'Ghid pentru susținere · Monitor-PV',
  description: 'Ghid detaliat pentru susținerea lucrării — termeni, arhitectură, demo, Q&A comisie.',
}

export const dynamic = 'force-static'

export default async function GhidPage() {
  const filePath = path.join(process.cwd(), 'docs', 'GHID-RADU.md')
  const content = await fs.readFile(filePath, 'utf8')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
      <aside className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-8 text-xs flex flex-col sm:flex-row gap-3 sm:items-center">
        <span className="text-blue-600 dark:text-blue-400 shrink-0 font-semibold">📘 Ghid de susținere</span>
        <p className="text-blue-900 dark:text-blue-100 leading-relaxed flex-1">
          Document gata pentru Profire Radu — termeni explicați, arhitectură, demo, întrebări tipice ale comisiei. Disponibil și ca <a href="https://github.com/Blondu2024/monitor-pv/blob/main/docs/GHID-RADU.md" target="_blank" rel="noopener" className="underline font-medium">markdown pe GitHub</a> pentru download.
        </p>
      </aside>

      <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h3:text-base prose-a:text-amber-700 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-code:text-amber-700 dark:prose-code:text-amber-400 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-table:text-sm prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-zinc-200 dark:prose-td:border-zinc-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>

      <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 justify-between text-xs text-zinc-500">
        <Link href="/" className="hover:text-amber-700 dark:hover:text-amber-400">‹ Înapoi la dashboard</Link>
        <span>Versiune ghid v1.0 · 5 iunie 2026</span>
      </div>
    </div>
  )
}
