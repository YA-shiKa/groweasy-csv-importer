// These are the CRM fields GrowEasy wants back from the AI.
// Keeping the allowed values here so the frontend and backend agree.

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

export interface CrmRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: string | null;
  crm_note: string | null;
  data_source: string | null;
  possession_time: string | null;
  description: string | null;
}

export interface SkippedRecord {
  source_row_index: number;
  reason: string;
  original: Record<string, unknown> | null;
}

export interface ImportResponse {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

// one row from the raw uploaded CSV, before AI mapping
export type RawRow = Record<string, string>;
