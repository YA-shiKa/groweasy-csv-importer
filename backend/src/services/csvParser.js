import Papa from "papaparse";

export function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  if (result.errors?.length) {
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
