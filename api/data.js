// api/data.js — legge e salva i quiz dell'utente autenticato.
import { sql, ensureSchema, seedQuiz } from '../lib/db.js';
import { authUser, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Non autenticato' });

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM quiz_data WHERE user_id = ${user.uid}`;
      let d;
      if (rows.length) {
        d = rows[0].data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = { materie: [], settings: {} }; } }
      } else {
        d = seedQuiz();
        await sql`INSERT INTO quiz_data (user_id, data) VALUES (${user.uid}, ${JSON.stringify(d)}::jsonb)
                  ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`;
      }
      const shares = await sql`SELECT token, materia_id, argomento_id FROM shares WHERE user_id = ${user.uid}`;
      return res.status(200).json({ materie: d.materie || [], settings: d.settings || {}, shares });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req);
      const payload = {
        materie: Array.isArray(body.materie) ? body.materie : [],
        settings: (body.settings && typeof body.settings === 'object') ? body.settings : {}
      };
      await sql`INSERT INTO quiz_data (user_id, data, updated_at)
                VALUES (${user.uid}, ${JSON.stringify(payload)}::jsonb, now())
                ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
