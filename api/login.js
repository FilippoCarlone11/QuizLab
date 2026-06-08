// api/login.js — accesso a un account esistente.
import { sql, ensureSchema } from '../lib/db.js';
import { verifyPassword, signToken, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  try {
    await ensureSchema();
    const { email, password } = await readBody(req);
    const em = String(email || '').trim().toLowerCase();

    const rows = await sql`SELECT id, pass FROM users WHERE email = ${em}`;
    if (!rows.length || !verifyPassword(password, rows[0].pass)) {
      return res.status(401).json({ error: 'Email o password non corretti.' });
    }
    return res.status(200).json({ token: signToken({ uid: rows[0].id, email: em }), email: em });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
