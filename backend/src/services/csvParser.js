import Papa from "papaparse";

/**
 * Parses raw CSV text into an array of row objects, keyed by whatever
 * headers the source file actually has. We deliberately do NOT assume
 * fixed column names here - that mapping is the AI's job downstream.
 */
export function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  if (result.errors?.length) {
    // PapaParse reports row-level errors (e.g. malformed quotes) but usually
    // still recovers a usable row array - we surface errors without failing hard.
    const fatal = result.errors.filter((e) => e.type === "Delimiter");
    if (fatal.length) {
      throw new Error("Could not detect a valid CSV delimiter in the uploaded file.");
    }
  }

  const rows = (result.data || []).filter((row) =>
    Object.values(row).some((v) => v !== undefined && v !== null && String(v).trim() !== "")
  );

  return {
    headers: result.meta?.fields ?? [],
    rows,
    parseErrors: result.errors ?? [],
  };
}
