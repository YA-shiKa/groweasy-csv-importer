import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../services/csvParser.js";
import { validateRecord } from "../services/validator.js";

test("parseCsv extracts headers and rows regardless of column naming", () => {
  const csv = "Full Name,Email Address,Phone\nJohn Doe,john@x.com,999\n";
  const { headers, rows } = parseCsv(csv);
  assert.deepEqual(headers, ["Full Name", "Email Address", "Phone"]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["Email Address"], "john@x.com");
});

test("parseCsv drops fully empty rows", () => {
  const csv = "Name,Email\nJohn,john@x.com\n,\n";
  const { rows } = parseCsv(csv);
  assert.equal(rows.length, 1);
});

test("validateRecord accepts a record with email only", () => {
  const { record, skipped } = validateRecord({
    source_row_index: 0,
    skipped: false,
    email: "a@b.com",
    mobile_without_country_code: null,
  });
  assert.equal(skipped, false);
  assert.equal(record.email, "a@b.com");
});

test("validateRecord skips a record with neither email nor mobile", () => {
  const { skipped, reason } = validateRecord({
    source_row_index: 1,
    skipped: false,
    email: null,
    mobile_without_country_code: null,
  });
  assert.equal(skipped, true);
  assert.match(reason, /No email or mobile/);
});

test("validateRecord nulls out an invalid crm_status", () => {
  const { record } = validateRecord({
    source_row_index: 2,
    skipped: false,
    email: "a@b.com",
    crm_status: "SOMETHING_MADE_UP",
  });
  assert.equal(record.crm_status, null);
});

test("validateRecord nulls out an invalid data_source", () => {
  const { record } = validateRecord({
    source_row_index: 3,
    skipped: false,
    email: "a@b.com",
    data_source: "not_a_real_project",
  });
  assert.equal(record.data_source, null);
});

test("validateRecord respects the AI's own skip flag", () => {
  const { skipped, reason } = validateRecord({
    source_row_index: 4,
    skipped: true,
    skip_reason: "no usable contact info",
  });
  assert.equal(skipped, true);
  assert.equal(reason, "no usable contact info");
});
