import { Router } from "express";
import { csvUpload } from "../middleware/upload.js";
import { parseCsv } from "../services/csvParser.js";
import { extractCrmRecords } from "../services/geminiExtractor.js";
import { validateRecord } from "../services/validator.js";

export const importRouter = Router();

importRouter.post("/parse-preview", csvUpload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error("No file uploaded. Field name must be 'file'.");
      err.status = 400;
      throw err;
    }
    const csvText = req.file.buffer.toString("utf-8");
    const { headers, rows } = parseCsv(csvText);
    res.json({ headers, rows, rowCount: rows.length });
  } catch (err) {
    next(err);
  }
});

importRouter.post("/import", csvUpload.single("file"), async (req, res, next) => {
  try {
    let rows;

    if (req.file) {
      const csvText = req.file.buffer.toString("utf-8");
      ({ rows } = parseCsv(csvText));
    } else if (req.body?.rows) {
      const parsedBody = typeof req.body.rows === "string" ? JSON.parse(req.body.rows) : req.body.rows;
      if (!Array.isArray(parsedBody)) throw new Error("'rows' must be an array.");
      rows = parsedBody;
    } else {
      const err = new Error("Provide either a CSV file ('file') or a JSON 'rows' array.");
      err.status = 400;
      throw err;
    }

    if (rows.length === 0) {
      return res.json({ imported: [], skipped: [], totalImported: 0, totalSkipped: 0, totalRows: 0 });
    }

    const aiRecords = await extractCrmRecords(rows);

    const imported = [];
    const skipped = [];

    aiRecords.forEach((raw, i) => {
      const { record, skipped: isSkipped, reason } = validateRecord(raw);
      if (isSkipped) {
        skipped.push({ source_row_index: raw.source_row_index ?? i, reason, original: rows[raw.source_row_index ?? i] ?? null });
      } else {
        imported.push(record);
      }
    });

    res.json({
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
      totalRows: rows.length,
    });
  } catch (err) {
    next(err);
  }
});
