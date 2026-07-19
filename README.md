# AI-powered CSV Importer

This is a CSV importer that can read lead files in **any column layout**
(Facebook Lead Ads, Google Ads, Excel sheets, real-estate CRM exports, sales
reports, or a spreadsheet someone made by hand) and turns them into
GrowEasy's CRM format using Gemini.

Built for: **Software Developer Intern** application at GrowEasy.

## Live Demo

- **App:** https://groweasy-csv-importer-sand.vercel.app
- **API:** https://groweasy-csv-importer-5pxq.onrender.com

> The backend runs on Render's free plan, so it goes to sleep after 15
> minutes with no traffic. The first request after that can take 30–60
> seconds to respond while it wakes back up.

---

## How it works

```
┌────────────┐      ┌──────────────┐      ┌───────────────┐      ┌────────────┐
│ 1. Upload  │ ───▶ │ 2. Preview   │ ───▶ │ 3. Confirm     │ ───▶ │ 4. Result  │
│   CSV      │      │ (no AI yet)  │      │ (calls backend)│      │  (AI-mapped)│
└────────────┘      └──────────────┘      └───────────────┘      └────────────┘
```

- **Frontend** (Next.js 14, App Router, TypeScript, Tailwind) — you can drag
  and drop a file or click to upload it, see a preview of the raw rows, hit
  confirm, and then see the results split into "Imported" and "Skipped"
  tabs, with a button to download the final CRM data as a CSV.
- **Backend** (Node.js + Express) — reads the CSV, sends the rows to Gemini
  in batches with a strict format it has to follow, double-checks what
  Gemini returns against GrowEasy's rules, and sends back the results.
- **AI** (Gemini `2.5-flash`) — does the actual work of figuring out which
  column means what. See [Prompt design](#prompt-design) below for how it's
  kept from making up values that aren't allowed.

The AI is never called until you click **Confirm**. Before that, everything
happens in the browser — this matches what the assignment asked for.

---

## Project structure

```
groweasy-csv-importer/
├── backend/
│   ├── server.js                    # starts the Express server
│   └── src/
│       ├── constants.js             # the CRM field values that are allowed
│       ├── routes/importRoutes.js   # the two API routes
│       ├── services/
│       │   ├── csvParser.js         # turns raw CSV text into rows
│       │   ├── geminiExtractor.js   # sends rows to Gemini in batches, retries on failure
│       │   └── validator.js         # double-checks Gemini's output before it goes out
│       ├── middleware/              # file upload handling + error handling
│       └── tests/                   # unit tests
├── frontend/
│   ├── app/                         # page.tsx has the main 4-step flow
│   ├── components/                  # upload box, preview table, results table, etc.
│   └── lib/                         # shared types, API calls, CSV download logic
├── samples/                         # example CSV files to try
└── docker-compose.yml
```

---

## Setup

### 1. Get a Gemini API key

Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** and
click "Create API key".

### 2. Backend

```bash
cd backend
cp .env.example .env      # then paste your GEMINI_API_KEY into .env
npm install
npm run dev                # runs on http://localhost:8080
```

To run the unit tests (no API key needed for these, they just test the plain
logic):

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm install
npm run dev                 # runs on http://localhost:3000
```

### 4. Try it out

Upload any file from the `/samples` folder:

- `facebook_leads_export.csv` — looks like a Facebook ad lead export
- `google_ads_export.csv` — looks like a Google Ads export, and has one row
  with two email addresses in it
- `messy_real_estate_export.csv` — messy column names, two mobile number
  columns, and one row with no contact info at all (this one should end up
  in "Skipped")
- `linebreak_test.csv` — has a field with a line break inside it, to check
  that it doesn't break the row

### Docker (optional)

```bash
GEMINI_API_KEY=AQ.your_key_here docker compose up --build
```

---

## Prompt design

The AI extraction logic lives in `backend/src/services/geminiExtractor.js`.
Three things keep the output reliable:

1. **A strict output format** — Gemini has to return JSON that fits a
   schema we give it, so we don't have to pull data out of a plain text
   answer ourselves.
2. **A fixed list of allowed values** — `crm_status` and `data_source` can
   only be one of a few set values. If Gemini isn't sure which one fits, it
   leaves the field blank instead of guessing. There's also a check on the
   backend (`validator.js`) that removes any value that isn't on the list,
   just in case.
3. **Row numbers get echoed back** — every row we send has a number
   attached, and Gemini has to send that same number back with its answer.
   That way we can always match its output to the right original row.

Rows get sent in small batches (20 at a time by default) instead of all at
once, so we don't hit token limits on big files, and so if one batch fails
we can just retry that batch instead of redoing the whole file. If a batch
still fails after a few tries, those rows get marked as skipped with the
error explained, instead of the whole import failing.

---

## API

### `POST /api/parse-preview`

Send a CSV file (`multipart/form-data`, field name `file`) and get back the
headers and rows. No AI is called here — this is just for reading the file.

### `POST /api/import`

Send either `{ "rows": [...] }` as JSON, or a CSV file, and this is where
the actual AI mapping happens.

```json
{
  "imported": [ { "name": "...", "email": "...", "crm_status": "GOOD_LEAD_FOLLOW_UP", ... } ],
  "skipped": [ { "source_row_index": 2, "reason": "No email or mobile number found.", "original": { ... } } ],
  "totalImported": 4,
  "totalSkipped": 1,
  "totalRows": 5
}
```
