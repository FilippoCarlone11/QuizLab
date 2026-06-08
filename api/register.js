// api/register.js — crea un nuovo account.
import { sql, ensureSchema, seedQuiz } from '../lib/db.js';
import { hashPassword, signToken, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  try {
    await ensureSchema();
    const { email, password } = await readBody(req);
    const em = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return res.status(400).json({ error: 'Email non valida.' });
    if (String(password || '').length < 6) return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri.' });

    const existing = await sql`SELECT id FROM users WHERE email = ${em}`;
    if (existing.length) return res.status(409).json({ error: 'Esiste già un account con questa email.' });

    const rows = await sql`INSERT INTO users (email, pass) VALUES (${em}, ${hashPassword(password)}) RETURNING id`;
    const uid = rows[0].id;
    await sql`INSERT INTO quiz_data (user_id, data) VALUES (${uid}, ${JSON.stringify(seedQuiz())}::jsonb)`;

    return res.status(200).json({ token: signToken({ uid, email: em }), email: em });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
