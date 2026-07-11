import type { ImportResponse, RawRow } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {}

export async function importRows(rows: RawRow[]): Promise<ImportResponse> {
  const res = await fetch(`${API_BASE_URL}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Import failed with status ${res.status}`);
  }

  return res.json();
}
