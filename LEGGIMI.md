# QuizLab 🧠 — versione multi-utente per Vercel

Sito di quiz dove **ogni utente si registra** e crea i **propri** quiz, organizzati
per materia e per argomento. Pronto da pubblicare su **Vercel** (piano gratuito).

## Com'è fatto

- `index.html` — il sito (login/registrazione + studente + "I miei quiz")
- `api/register.js`, `api/login.js`, `api/data.js` — le funzioni serverless
- `lib/db.js`, `lib/auth.js` — database e autenticazione
- `package.json` — l'unica dipendenza è il driver del database

I dati stanno in un **database Postgres** (lo storage di Vercel, basato su Neon).
Le password sono salvate cifrate (hash **scrypt**), mai in chiaro.

---

## 🚀 Pubblicare su Vercel (passo passo)

1. **Crea un account** gratuito su [vercel.com](https://vercel.com).

2. **Carica il progetto.** Due modi a scelta:
   - **Da GitHub:** metti questa cartella in un repository GitHub, poi su Vercel
     fai *Add New → Project* e importa il repository.
   - **Da terminale:** installa la CLI con `npm i -g vercel`, entra nella cartella
     del progetto e lancia `vercel`, seguendo le domande.

3. **Crea il database.** Nel progetto su Vercel apri la scheda **Storage** →
   *Create Database* → scegli **Postgres**. Collegalo al progetto: Vercel imposta
   da solo le variabili di connessione (`DATABASE_URL` / `POSTGRES_URL`).
   > ⚠️ Usa **Vercel Postgres / Neon**: il progetto usa il driver Neon.

4. **Aggiungi il segreto per i login.** Vai in **Settings → Environment Variables**
   e aggiungi:
   - nome: `AUTH_SECRET`
   - valore: una stringa lunga e casuale (per generarla: `openssl rand -hex 32`)

5. **Rifai il deploy** (scheda *Deployments → Redeploy*) così vengono lette le
   nuove variabili.

6. **Apri l'indirizzo del sito**, registrati e inizia a creare i tuoi quiz. 🎉

Le tabelle del database vengono create da sole al primo utilizzo: non devi fare nulla a mano.

---

## 💻 Provare in locale (facoltativo)

```bash
npm i -g vercel          # una volta sola
vercel link              # collega la cartella al progetto Vercel
vercel env pull .env.local   # scarica le variabili del database
vercel dev               # avvia in locale (di solito su http://localhost:3000)
```

---

## Come si usa il sito

- **Registrati / Accedi** con email e password.
- **Studia:** scegli una materia → un argomento → fai il quiz → vedi il punteggio.
- **I miei quiz:** crea materie, aggiungi argomenti e inserisci le domande in **JSON**.
  Puoi anche **importare** una materia intera ed **esportare** un backup.
- **Condividi un quiz:** in "I miei quiz", premi **🔗** accanto a un quiz per ottenere un
  **link pubblico**. Chiunque lo apra può fare quel quiz **senza registrarsi**. Le tue
  modifiche si aggiornano da sole, e puoi **disattivare** il link quando vuoi.
  Il link ha la forma `https://tuosito.vercel.app/?q=...`.

### Formato JSON delle domande

```json
[
  {
    "domanda": "Quanto fa 2 + 2?",
    "opzioni": ["3", "4", "5", "22"],
    "corretta": 1,
    "spiegazione": "2 + 2 = 4."
  }
]
```

`corretta` è l'indice della risposta giusta e **parte da 0** (`1` = seconda opzione).
`spiegazione` è facoltativa.

Al primo accesso ogni nuovo utente trova Matematica e Geografia come esempio:
si possono cancellare dall'area "I miei quiz".
