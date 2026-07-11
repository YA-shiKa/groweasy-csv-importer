import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "../constants.js";

function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === "" || s.toLowerCase() === "null" ? null : s;
}

export function validateRecord(raw) {
  const record = {
    created_at: clean(raw.created_at),
    name: clean(raw.name),
    email: clean(raw.email),
    country_code: clean(raw.country_code),
    mobile_without_country_code: clean(raw.mobile_without_country_code),
    company: clean(raw.company),
    city: clean(raw.city),
    state: clean(raw.state),
    country: clean(raw.country),
    lead_owner: clean(raw.lead_owner),
    crm_status: clean(raw.crm_status),
    crm_note: clean(raw.crm_note),
    data_source: clean(raw.data_source),
    possession_time: clean(raw.possession_time),
    description: clean(raw.description),
  };

  if (record.crm_status && !CRM_STATUS_VALUES.includes(record.crm_status)) {
    record.crm_status = null;
  }
  if (record.data_source && !DATA_SOURCE_VALUES.includes(record.data_source)) {
    record.data_source = null;
  }

  if (raw.skipped) {
    return { record, skipped: true, reason: raw.skip_reason || "Marked skipped by AI extraction." };
  }

  if (!record.email && !record.mobile_without_country_code) {
    return { record, skipped: true, reason: "No email or mobile number found." };
  }

  if (record.created_at && Number.isNaN(new Date(record.created_at).getTime())) {
    record.crm_note = [record.crm_note, `(original created_at unparseable: "${raw.created_at}")`]
      .filter(Boolean)
      .join("; ");
    record.created_at = null;
  }

  return { record, skipped: false, reason: null };
}
