// lib/db.js — connessione al database Postgres (Neon) e schema.
import { neon } from '@neondatabase/serverless';

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    ''
  );
}

// Connessione "pigra": creata solo al primo utilizzo. Così, se manca la
// variabile d'ambiente, la funzione NON va in crash all'avvio: restituisce
// invece un errore chiaro che spiega cosa configurare.
let _client = null;
function client() {
  if (_client) return _client;
  const cs = connectionString();
  if (!cs) {
    const e = new Error(
      'Database non configurato: manca la variabile di connessione ' +
      '(DATABASE_URL o POSTGRES_URL). Collega un database Postgres (Neon) ' +
      'dal pannello Vercel → Storage e rifai il deploy.'
    );
    e.code = 'NO_DB';
    throw e;
  }
  _client = neon(cs);
  return _client;
}

// `sql` resta utilizzabile come template: sql`SELECT ...`
export function sql(strings, ...values) {
  return client()(strings, ...values);
}

let schemaReady = false;
export async function ensureSchema() {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    pass       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS quiz_data (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS shares (
    token        TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    materia_id   TEXT NOT NULL,
    argomento_id TEXT NOT NULL,
    title        TEXT,
    emoji        TEXT,
    color        TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, materia_id, argomento_id)
  )`;
  schemaReady = true;
}

// Quiz di esempio assegnati a ogni nuovo utente.
export function seedQuiz() {
  return {
    materie: [
      {
        id: 'm-mate', nome: 'Matematica', emoji: '📐', color: '#4DA6FF',
        argomenti: [
          {
            id: 'a-mate-1', nome: 'Operazioni di base', domande: [
              { domanda: 'Quanto fa 7 × 8?', opzioni: ['54', '56', '63', '48'], corretta: 1, spiegazione: '7 × 8 = 56.' },
              { domanda: 'Qual è il risultato di 144 ÷ 12?', opzioni: ['11', '13', '12', '14'], corretta: 2, spiegazione: '12 × 12 = 144.' },
              { domanda: 'Quanto fa 25% di 200?', opzioni: ['25', '40', '50', '75'], corretta: 2, spiegazione: 'Il 25% è un quarto: 200 ÷ 4 = 50.' }
            ]
          }
        ]
      },
      {
        id: 'm-geo', nome: 'Geografia', emoji: '🌍', color: '#3DD6A0',
        argomenti: [
          {
            id: 'a-geo-1', nome: 'Capitali europee', domande: [
              { domanda: 'Qual è la capitale della Francia?', opzioni: ['Lione', 'Marsiglia', 'Parigi', 'Nizza'], corretta: 2, spiegazione: 'Parigi.' },
              { domanda: 'Qual è la capitale del Portogallo?', opzioni: ['Porto', 'Lisbona', 'Madrid', 'Faro'], corretta: 1, spiegazione: 'Lisbona.' }
            ]
          }
        ]
      }
    ],
    settings: {}
  };
}
