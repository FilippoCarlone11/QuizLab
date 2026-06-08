// api/share.js — crea/recupera o disattiva il link pubblico di un quiz (argomento).
import crypto from 'crypto';
import { sql, ensureSchema } from '../lib/db.js';
import { authUser, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    await ensureSchema();

    if (req.method === 'POST') {
      const { materia_id, argomento_id, title, emoji, color } = await readBody(req);
      if (!materia_id || !argomento_id) return res.status(400).json({ error: 'Dati mancanti.' });

      const existing = await sql`SELECT token FROM shares
        WHERE user_id = ${user.uid} AND materia_id = ${materia_id} AND argomento_id = ${argomento_id}`;
      if (existing.length) return res.status(200).json({ token: existing[0].token });

      const token = crypto.randomBytes(6).toString('hex'); // 12 caratteri
      await sql`INSERT INTO shares (token, user_id, materia_id, argomento_id, title, emoji, color)
        VALUES (${token}, ${user.uid}, ${materia_id}, ${argomento_id}, ${title || ''}, ${emoji || ''}, ${color || ''})`;
      return res.status(200).json({ token });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url, 'http://x');
      let token = url.searchParams.get('token');
      if (!token) { token = (await readBody(req)).token; }
      if (!token) return res.status(400).json({ error: 'Token mancante.' });
      await sql`DELETE FROM shares WHERE token = ${token} AND user_id = ${user.uid}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
