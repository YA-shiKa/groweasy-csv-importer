// turns the imported CRM records back into a CSV file the user can download

import Papa from "papaparse";
import type { CrmRecord } from "./types";

// same column order as the assignment's sample CSV
const COLUMN_ORDER = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

export function downloadCrmRecordsAsCsv(records: CrmRecord[], filename: string) {
  if (!filename) {
    filename = "groweasy_crm_import.csv";
  }

  const rows = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const row: Record<string, string> = {};
    for (const col of COLUMN_ORDER) {
      row[col] = (record as any)[col] || "";
    }
    rows.push(row);
  }

  const csvText = Papa.unparse(rows, { columns: COLUMN_ORDER });
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
