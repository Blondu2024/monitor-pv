// Trimitere email via Resend (REST, fără SDK). Folosit pentru alerte de alarme critice.

const FROM = process.env.RESEND_FROM || 'Monitor-PV <onboarding@resend.dev>'
const TO = process.env.ALERT_EMAIL || 'tanasecristian2007@gmail.com'

export type AlertEmailInput = {
  severity: 'info' | 'warning' | 'critical'
  code: string
  message: string
  siteName: string
  deviceName: string
  ts: string
}

/** Trimite un email de alertă. Întoarce {ok} — nu aruncă, ca să nu rupă cronul. */
export async function sendAlertEmail(a: AlertEmailInput): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY lipsește' }

  const color = a.severity === 'critical' ? '#dc2626' : a.severity === 'warning' ? '#d97706' : '#2563eb'
  const when = new Date(a.ts).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
      <div style="border-left:4px solid ${color};padding:12px 16px;background:#fafafa">
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${color};font-weight:600">
          Alarmă ${a.severity}
        </p>
        <h2 style="margin:0 0 8px;font-size:18px;color:#18181b">${a.code}</h2>
        <p style="margin:0 0 12px;color:#3f3f46">${a.message}</p>
        <table style="font-size:13px;color:#52525b;border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0">Site</td><td><b>${a.siteName}</b></td></tr>
          <tr><td style="padding:2px 12px 2px 0">Echipament</td><td><b>${a.deviceName}</b></td></tr>
          <tr><td style="padding:2px 12px 2px 0">Moment</td><td>${when}</td></tr>
        </table>
      </div>
      <p style="font-size:12px;color:#a1a1aa;margin-top:16px">
        Monitor-PV · sistem de monitorizare fotovoltaică. Acest email a fost generat automat.
      </p>
    </div>`

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        subject: `[Monitor-PV] ${a.severity === 'critical' ? '🔴' : '🟠'} ${a.code} — ${a.siteName}`,
        html,
      }),
    })
    if (!r.ok) return { ok: false, error: `Resend ${r.status}: ${(await r.text()).slice(0, 200)}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'eroare necunoscută' }
  }
}
