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
    if (!mat) return res.status(404).json({ error: 'Questo quiz non è più disponibile.' });

    // Condivisione dell'intera materia (argomento_id vuoto)
    if (!sh.argomento_id) {
      const argomenti = (mat.argomenti || [])
        .filter((a) => Array.isArray(a.domande) && a.domande.length > 0)
        .map((a) => ({ id: a.id, nome: a.nome, domande: a.domande, esame: a.esame || null, mescola: !!a.mescola }));
      if (!argomenti.length) return res.status(404).json({ error: 'Questa materia non è più disponibile.' });
      return res.status(200).json({
        type: 'materia',
        title: mat.nome,
        emoji: mat.emoji || '📘',
        color: mat.color || '#FF6B5E',
        argomenti
      });
    }

    // Condivisione di un singolo argomento
    const arg = (mat.argomenti || []).find((a) => a.id === sh.argomento_id);
    if (!arg || !Array.isArray(arg.domande) || arg.domande.length === 0) {
      return res.status(404).json({ error: 'Questo quiz non è più disponibile.' });
    }
    return res.status(200).json({
      type: 'quiz',
      title: arg.nome,
      subtitle: mat.nome,
      emoji: mat.emoji || '📘',
      color: mat.color || '#FF6B5E',
      domande: arg.domande,
      esame: arg.esame || null,
      mescola: !!arg.mescola
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Errore del server: ' + e.message });
  }
}
