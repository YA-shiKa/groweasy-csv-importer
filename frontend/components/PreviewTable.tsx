"use client";

import type { RawRow } from "@/lib/types";

// only render the first 200 rows so the browser doesn't slow down on huge files
const MAX_ROWS_TO_SHOW = 200;

export default function PreviewTable({ headers, rows }: { headers: string[]; rows: RawRow[] }) {
  const rowsToShow = rows.slice(0, MAX_ROWS_TO_SHOW);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="sticky top-0 bg-white border-b px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {headers.map((header) => (
                  <td key={header} className="px-3 py-2 whitespace-nowrap">
                    {row[header] ? row[header] : <span className="text-gray-300">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > MAX_ROWS_TO_SHOW && (
        <p className="text-xs text-gray-500 px-3 py-2 border-t">
          Showing first {MAX_ROWS_TO_SHOW} of {rows.length} rows. All rows will still be imported.
        </p>
      )}
    </div>
  );
}
