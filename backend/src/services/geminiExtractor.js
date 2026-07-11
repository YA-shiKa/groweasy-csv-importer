import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES, CRM_FIELDS } from "../constants.js";

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 20;
const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 3;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }
  return new GoogleGenerativeAI(apiKey);
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    records: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          source_row_index: { type: SchemaType.INTEGER },
          skipped: { type: SchemaType.BOOLEAN },
          skip_reason: { type: SchemaType.STRING, nullable: true },
          created_at: { type: SchemaType.STRING, nullable: true },
          name: { type: SchemaType.STRING, nullable: true },
          email: { type: SchemaType.STRING, nullable: true },
          country_code: { type: SchemaType.STRING, nullable: true },
          mobile_without_country_code: { type: SchemaType.STRING, nullable: true },
          company: { type: SchemaType.STRING, nullable: true },
          city: { type: SchemaType.STRING, nullable: true },
          state: { type: SchemaType.STRING, nullable: true },
          country: { type: SchemaType.STRING, nullable: true },
          lead_owner: { type: SchemaType.STRING, nullable: true },
          crm_status: { type: SchemaType.STRING, nullable: true },
          crm_note: { type: SchemaType.STRING, nullable: true },
          data_source: { type: SchemaType.STRING, nullable: true },
          possession_time: { type: SchemaType.STRING, nullable: true },
          description: { type: SchemaType.STRING, nullable: true },
        },
        required: ["source_row_index", "skipped"],
      },
    },
  },
  required: ["records"],
};

function buildSystemPrompt() {
  return `You are a data-mapping engine for GrowEasy, a real-estate CRM.

You will receive a JSON array of raw CSV rows exported from arbitrary sources
(Facebook Lead Ads, Google Ads, Excel sheets, real-estate CRM exports, sales
reports, marketing agency CSVs, manually created spreadsheets). Column names,
casing, order, and structure are NOT fixed and will vary between uploads.

Your job: map each raw row onto the GrowEasy CRM schema below, using your best
judgement about which source column(s) correspond to which CRM field, even
when names are abbreviated, misspelled, in a different language, or absent.

CRM SCHEMA
${CRM_FIELDS.map((f) => `- ${f}`).join("\n")}

RULES (follow exactly):
1. crm_status: use ONLY one of ${CRM_STATUS_VALUES.join(", ")}. If the source
   has a status/stage field, map it to the closest matching value. If there is
   no reasonable match, leave it null - never invent a value outside this list.
2. data_source: use ONLY one of ${DATA_SOURCE_VALUES.join(", ")}. If nothing in
   the row confidently matches one of these, leave it null. Do not guess.
3. created_at: normalize to a string that JavaScript's \`new Date(created_at)\`
   can parse correctly (e.g. "2026-05-13 14:20:48" or full ISO-8601). If no
   date is present, leave it null.
4. crm_note: use this field for remarks, follow-up notes, additional comments,
   and any EXTRA phone numbers or email addresses beyond the primary ones, and
   any other useful information from the row that doesn't fit another field.
   Combine multiple items with "; " separators. Never insert literal newlines;
   if you must represent a line break, escape it as \\n.
5. If a row has multiple email addresses: put the first one in "email" and
   append the rest into crm_note (labelled, e.g. "alt email: x@y.com").
   If a row has multiple mobile numbers: put the first one in
   "mobile_without_country_code" and append the rest into crm_note the same way.
6. country_code should be a bare calling code like "+91" if determinable,
   otherwise null. mobile_without_country_code must not include the country
   code or any punctuation/spaces.
7. SKIP a row (set "skipped": true and a short "skip_reason") if and only if
   the row contains NEITHER a usable email NOR a usable mobile number after
   your extraction. Otherwise "skipped" must be false.
8. Always echo back "source_row_index" exactly as given in the input so the
   caller can align your output with the original rows. Return exactly one
   output object per input row, in the same order, even for skipped rows.
9. Never fabricate data that is not present or reasonably inferable in the row.
   Leave a field null rather than guessing when unsure.
10. Output must strictly conform to the provided JSON schema. No extra text.`;
}

async function callGeminiBatch(model, batchRows, startIndex) {
  const payload = batchRows.map((row, i) => ({
    source_row_index: startIndex + i,
    raw: row,
  }));

  const prompt = `Map the following ${payload.length} raw CSV rows to the GrowEasy CRM schema.\n\nINPUT ROWS (JSON):\n${JSON.stringify(
    payload
  )}`;

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.records)) {
        throw new Error("Model response missing 'records' array.");
      }
      return parsed.records;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }
  return batchRows.map((_, i) => ({
    source_row_index: startIndex + i,
    skipped: true,
    skip_reason: `AI extraction failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? "unknown error"}`,
  }));
}

export async function extractCrmRecords(rows, { onProgress } = {}) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
    },
  });

  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  const allRecords = [];
  for (let b = 0; b < batches.length; b++) {
    const startIndex = b * BATCH_SIZE;
    const records = await callGeminiBatch(model, batches[b], startIndex);
    allRecords.push(...records);
    onProgress?.({ completedBatches: b + 1, totalBatches: batches.length });
  }

  return allRecords;
}
