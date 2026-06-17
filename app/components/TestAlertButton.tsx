'use client'

import { useActionState } from 'react'
import { sendTestAlert, type TestAlertState } from '@/lib/alarm-test'

export default function TestAlertButton() {
  const [state, action, pending] = useActionState<TestAlertState, FormData>(
    () => sendTestAlert(),
    undefined
  )

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-60 text-xs font-medium px-3 py-1.5 transition-colors"
        >
          <span aria-hidden>✉</span>
          {pending ? 'Se trimite…' : 'Trimite alertă de test'}
        </button>
      </form>
      {state?.ok ? <span className="text-[11px] text-green-600 dark:text-green-400">{state.message}</span> : null}
      {state?.error ? <span className="text-[11px] text-red-600 dark:text-red-400">{state.error}</span> : null}
    </div>
  )
}
