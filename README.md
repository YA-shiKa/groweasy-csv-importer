# GrowEasy CSV → CRM Importer

An AI-powered CSV importer that ingests lead exports in **any column layout**
(Facebook Lead Ads, Google Ads, Excel sheets, real-estate CRM exports, sales
reports, manually built spreadsheets) and maps them into GrowEasy's fixed CRM
schema using Gemini.

Built for: **Software Developer Intern** application at GrowEasy.

## Live Demo

- **App:** https://groweasy-csv-importer-sand.vercel.app
- **API:** https://groweasy-csv-importer-5pxq.onrender.com

> Backend is hosted on Render's free tier and sleeps after 15 minutes of
> inactivity. The first request after idle time may take 30–60 seconds to
> respond while it wakes up.

---

## How it works

```
┌────────────┐      ┌──────────────┐      ┌───────────────┐      ┌────────────┐
│ 1. Upload  │ ───▶ │ 2. Preview   │ ───▶ │ 3. Confirm     │ ───▶ │ 4. Result  │
│   CSV      │      │ (no AI yet)  │      │ (calls backend)│      │  (AI-mapped)│
└────────────┘      └──────────────┘      └───────────────┘      └────────────┘
```

- **Frontend** (Next.js 14, App Router, TypeScript, Tailwind) — drag & drop
  upload, client-side CSV parsing for an instant preview, a confirm step, a
  results view split into "Imported" / "Skipped" tabs, and a CSV export
  button to download the mapped records.
- **Backend** (Node.js + Express) — re-parses the CSV server-side, batches
  rows to Gemini with a strict JSON schema, validates the AI's output against
  GrowEasy's business rules, and returns structured results.
- **AI** (Gemini `2.5-flash` via `@google/generative-ai`) — does the actual
  field mapping. See [Prompt design](#prompt-design) below for how it's
  constrained to avoid hallucinated enum values.

No AI call happens until the user clicks **Confirm** — steps 1–2 are pure
client-side parsing, exactly as the assignment specifies.

---

## Project structure

```
groweasy-csv-importer/
├── backend/
│   ├── server.js                    # Express entrypoint
│   └── src/
│       ├── constants.js             # CRM enums shared by prompt + validator
│       ├── routes/importRoutes.js   # /api/parse-preview, /api/import
│       ├── services/
│       │   ├── csvParser.js         # header-agnostic CSV -> row objects
│       │   ├── geminiExtractor.js   # batched AI extraction + retries
│       │   └── validator.js         # server-side safety net on AI output
│       ├── middleware/              # multer upload + error handling
│       └── tests/                   # unit tests (node:test)
├── frontend/
│   ├── app/                         # page.tsx = the 4-step flow
│   ├── components/                  # Dropzone, PreviewTable, ResultsTable, ...
│   └── lib/                         # shared types, API client, CSV export
├── samples/                         # example CSVs in different formats
└── docker-compose.yml
```

---

## Setup

### 1. Get a Gemini API key

Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** →
"Create API key".

### 2. Backend

```bash
cd backend
cp .env.example .env      # then paste your GEMINI_API_KEY into .env
npm install
npm run dev                # http://localhost:8080
```

Run the unit tests (pure logic, no API key needed):

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm install
npm run dev                 # http://localhost:3000
```

### 4. Try it

Upload any file from `/samples`:

- `facebook_leads_export.csv` — Facebook-style ad-lead columns
- `google_ads_export.csv` — Google Ads style, with a multi-email row
- `messy_real_estate_export.csv` — inconsistent naming, two mobile columns,
  one row with no contact info at all (should end up in "Skipped")
- `linebreak_test.csv` — a field with an embedded multi-line remark, to
  confirm line breaks are escaped instead of corrupting the row

### Docker (optional)

```bash
GEMINI_API_KEY=AQ.your_key_here docker compose up --build
```

---

## Prompt design

The extraction prompt (`backend/src/services/geminiExtractor.js`) does three
things to keep output reliable:

1. **Structured output schema** — the Gemini call passes a `responseSchema`,
   so the model is constrained to return well-typed JSON instead of us
   regex-parsing free text out of a chat response.
2. **Explicit enum whitelists** — `crm_status` and `data_source` values are
   listed verbatim in the system prompt with an instruction to leave the
   field `null` rather than invent a value. This is re-checked server-side in
   `validator.js` as a safety net — even if the model drifts, an invalid enum
   value can never reach the CRM.
3. **Row-index echoing** — every batch item carries a `source_row_index` that
   the model must echo back, so results can always be aligned to the original
   CSV row even if the AI reorders or drops something.

Rows are sent in batches (`BATCH_SIZE`, default 20) rather than one giant
prompt, both to stay within token limits on large files and so a single bad
batch can be retried (`MAX_RETRIES`, default 3, exponential backoff) without
re-processing the whole file. A batch that exhausts its retries is marked
skipped with the underlying error as the reason, rather than failing the
entire import.

---

## API

### `POST /api/parse-preview`

`multipart/form-data`, field `file` — parses a CSV and returns headers/rows.
No AI call. (The frontend currently parses client-side for instant preview;
this endpoint exists so parsing logic stays consistent if you want the
backend to be the single source of truth instead.)

### `POST /api/import`

Body: `{ "rows": [...] }` (JSON, from the confirmed preview) **or**
`multipart/form-data` with a `file` field.

```json
{
  "imported": [ { "name": "...", "email": "...", "crm_status": "GOOD_LEAD_FOLLOW_UP", ... } ],
  "skipped": [ { "source_row_index": 2, "reason": "No email or mobile number found.", "original": { ... } } ],
  "totalImported": 4,
  "totalSkipped": 1,
  "totalRows": 5
}
```

---

## Deployment

- **Frontend** → Vercel: set `NEXT_PUBLIC_API_BASE_URL` to your deployed
  backend URL.
- **Backend** → Render (free tier): set `GEMINI_API_KEY`, `FRONTEND_ORIGIN`
  (your exact Vercel URL, no trailing slash — CORS matching is exact-string),
  and optionally `BATCH_SIZE` / `MAX_RETRIES`. Railway's free offering is now
  trial-credit-only rather than a permanent free tier, so Render is the
  better fit for a project like this.

---
