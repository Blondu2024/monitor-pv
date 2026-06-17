'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServer } from './supabase/server'

const LoginSchema = z.object({
  // Tolerează spații/majuscule accidentale (autocapitalizare pe mobil) la email.
  email: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.email({ error: 'Introdu o adresă de email validă.' })
  ),
  // Tolerează spații la început/sfârșit (artefacte de copy-paste).
  password: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string().min(1, { error: 'Parola este obligatorie.' })
  ),
  next: z.string().optional(),
})

export type LoginState = {
  error?: string
} | undefined

/** Server Action: autentificare email + parolă prin Supabase Auth. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Date invalide.' }
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Mesaj generic — nu divulgăm dacă emailul există sau nu.
    return { error: 'Email sau parolă incorecte.' }
  }

  // Redirect doar către căi interne (previne open-redirect).
  const next = parsed.data.next
  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  redirect(dest)
}

/** Server Action: deconectare. */
export async function logout() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
