// small helper that just calls our backend import endpoint

import type { ImportResponse, RawRow } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export class ApiError extends Error {}

export async function importRows(rows: RawRow[]): Promise<ImportResponse> {
  const response = await fetch(API_URL + "/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows: rows }),
  });

  if (!response.ok) {
    let message = "Import failed with status " + response.status;
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch (e) {
      // response wasn't JSON, just use the default message above
    }
    throw new ApiError(message);
  }

  const data = await response.json();
  return data;
}
