// Provizionează un cont de operator în Supabase Auth.
// Rulează: node --env-file=.env.local scripts/create-user.mjs <email> <parola>
// Fără argumente folosește contul demo de mai jos.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Lipsesc NEXT_PUBLIC_SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY din .env.local')
  process.exit(1)
}

const email = process.argv[2] ?? 'radu@monitor-pv.ro'
const password = process.argv[3] ?? 'MonitorPV2026!'

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // marcăm emailul confirmat (fără flow de confirmare pe email)
})

if (error) {
  // Dacă există deja, doar resetăm parola ca să fie predictibilă pentru demo.
  if (error.message?.toLowerCase().includes('already')) {
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email === email)
    if (existing) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, { password })
      if (updErr) {
        console.error('Eroare la actualizarea parolei:', updErr.message)
        process.exit(1)
      }
      console.log(`✓ Cont existent, parolă resetată: ${email}`)
      process.exit(0)
    }
  }
  console.error('Eroare la crearea contului:', error.message)
  process.exit(1)
}

console.log(`✓ Cont creat: ${email}  (id: ${data.user.id})`)
console.log(`  Parolă: ${password}`)
