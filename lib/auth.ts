'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServer } from './supabase/server'
import { supabaseAdmin } from './supabase'

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

const SignupSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.email({ error: 'Introdu o adresă de email validă.' })
  ),
  password: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string().min(8, { error: 'Parola trebuie să aibă cel puțin 8 caractere.' })
  ),
  next: z.string().optional(),
})

/**
 * Server Action: înregistrare cont nou cu acces instant.
 * Creează contul confirmat (service role) și autentifică imediat — fără pas de
 * confirmare pe email, pentru un flux self-serve fără fricțiune.
 */
export async function signup(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Date invalide.' }
  }
  const { email, password } = parsed.data

  // Creează utilizatorul confirmat (service role, rămâne pe server).
  const admin = supabaseAdmin()
  const { error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createErr) {
    const msg = createErr.message?.toLowerCase() ?? ''
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exist')) {
      return { error: 'Există deja un cont cu acest email. Folosește autentificarea.' }
    }
    return { error: 'Nu s-a putut crea contul. Încearcă din nou.' }
  }

  // Autentifică imediat (setează cookie-ul de sesiune).
  const supabase = await createSupabaseServer()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) {
    // Contul s-a creat, dar login-ul a eșuat — trimite-l la pagina de login.
    redirect('/login')
  }

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
