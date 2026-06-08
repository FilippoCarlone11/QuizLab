// api/public.js — restituisce un quiz condiviso, SENZA autenticazione.
import { sql, ensureSchema } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });
  try {
    await ensureSchema();
    const url = new URL(req.url, 'http://x');
    const token = url.searchParams.get('token');
    if (!token) return res.status(400).json({ error: 'Token mancante.' });

    const rows = await sql`SELECT user_id, materia_id, argomento_id FROM shares WHERE token = ${token}`;
    if (!rows.length) return res.status(404).json({ error: 'Quiz non trovato o link disattivato.' });
    const sh = rows[0];

    const q = await sql`SELECT data FROM quiz_data WHERE user_id = ${sh.user_id}`;
    if (!q.length) return res.status(404).json({ error: 'Questo quiz non è più disponibile.' });
    let d = q[0].data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = { materie: [] }; } }

    const mat = (d.materie || []).find((m) => m.id === sh.materia_id);
    const arg = mat && (mat.argomenti || []).find((a) => a.id === sh.argomento_id);
    if (!mat || !arg || !Array.isArray(arg.domande) || arg.domande.length === 0) {
      return res.status(404).json({ error: 'Questo quiz non è più disponibile.' });
    }

    return res.status(200).json({
      title: arg.nome,
      subtitle: mat.nome,
      emoji: mat.emoji || '📘',
      color: mat.color || '#FF6B5E',
      domande: arg.domande
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
