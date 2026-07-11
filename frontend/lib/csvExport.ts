import Papa from "papaparse";
import type { CrmRecord } from "./types";

const EXPORT_COLUMNS: (keyof CrmRecord)[] = [
  "created_at", "name", "email", "country_code", "mobile_without_country_code",
  "company", "city", "state", "country", "lead_owner", "crm_status",
  "crm_note", "data_source", "possession_time", "description",
];

export function downloadCrmRecordsAsCsv(records: CrmRecord[], filename = "groweasy_crm_import.csv") {
  const rows = records.map((rec) =>
    Object.fromEntries(EXPORT_COLUMNS.map((c) => [c, rec[c] ?? ""]))
  );
  const csv = Papa.unparse(rows, { columns: EXPORT_COLUMNS as string[] });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}