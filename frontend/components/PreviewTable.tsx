"use client";

import type { RawRow } from "@/lib/types";

interface PreviewTableProps {
  headers: string[];
  rows: RawRow[];
}

const MAX_PREVIEW_ROWS = 200; // avoid rendering huge DOM trees for very large CSVs

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  const visibleRows = rows.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-paper/10">
      <div className="max-h-[420px] overflow-auto rounded-2xl">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="sticky-head scroll-shadow whitespace-nowrap border-b border-ink/10 bg-paper px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-ink/60 dark:border-paper/10 dark:bg-slate-950 dark:text-paper/60"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="odd:bg-ink/[0.015] hover:bg-accent-soft/60 dark:odd:bg-paper/[0.02] dark:hover:bg-accent/10"
              >
                {headers.map((h) => (
                  <td key={h} className="whitespace-nowrap px-4 py-2.5 text-ink/80 dark:text-paper/80">
                    {row[h] || <span className="text-ink/25 dark:text-paper/25">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > MAX_PREVIEW_ROWS && (
        <p className="border-t border-ink/10 px-4 py-2 text-xs text-ink/50 dark:border-paper/10 dark:text-paper/50">
          Showing first {MAX_PREVIEW_ROWS.toLocaleString()} of {rows.length.toLocaleString()} rows. All rows will
          be sent for import.
        </p>
      )}
    </div>
  );
}
