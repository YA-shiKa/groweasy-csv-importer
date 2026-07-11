"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "@/lib/types";

const CRM_COLUMNS: (keyof CrmRecord)[] = [
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "crm_status",
  "data_source",
  "lead_owner",
  "possession_time",
  "created_at",
  "crm_note",
  "description",
];

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "bg-signal-good/10 text-signal-good",
  SALE_DONE: "bg-accent-soft text-accent dark:bg-accent/20",
  DID_NOT_CONNECT: "bg-signal-neutral/15 text-signal-neutral",
  BAD_LEAD: "bg-signal-bad/10 text-signal-bad",
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ink/25 dark:text-paper/25">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
        STATUS_STYLES[status] ?? "bg-ink/5 text-ink/60"
      }`}
    >
      {status}
    </span>
  );
}

interface ResultsTableProps {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}

export default function ResultsTable({ imported, skipped }: ResultsTableProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <TabButton active={tab === "imported"} onClick={() => setTab("imported")} count={imported.length} label="Imported" tone="good" />
        <TabButton active={tab === "skipped"} onClick={() => setTab("skipped")} count={skipped.length} label="Skipped" tone="bad" />
      </div>

      {tab === "imported" ? (
        <div className="rounded-2xl border border-ink/10 dark:border-paper/10">
          <div className="max-h-[480px] overflow-auto rounded-2xl">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr>
                  {CRM_COLUMNS.map((c) => (
                    <th
                      key={c}
                      className="sticky-head scroll-shadow whitespace-nowrap border-b border-ink/10 bg-paper px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-ink/60 dark:border-paper/10 dark:bg-slate-950 dark:text-paper/60"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imported.map((rec, i) => (
                  <tr key={i} className="odd:bg-ink/[0.015] hover:bg-accent-soft/60 dark:odd:bg-paper/[0.02] dark:hover:bg-accent/10">
                    {CRM_COLUMNS.map((c) => (
                      <td key={c} className="max-w-[220px] truncate whitespace-nowrap px-4 py-2.5 text-ink/80 dark:text-paper/80">
                        {c === "crm_status" ? (
                          <StatusBadge status={rec.crm_status} />
                        ) : rec[c] ? (
                          String(rec[c])
                        ) : (
                          <span className="text-ink/25 dark:text-paper/25">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {imported.length === 0 && <EmptyState message="No records were successfully imported." />}
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/10 dark:border-paper/10">
          <div className="max-h-[480px] overflow-auto rounded-2xl">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky-head scroll-shadow whitespace-nowrap border-b border-ink/10 bg-paper px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-ink/60 dark:border-paper/10 dark:bg-slate-950 dark:text-paper/60">
                    Row #
                  </th>
                  <th className="sticky-head scroll-shadow whitespace-nowrap border-b border-ink/10 bg-paper px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-ink/60 dark:border-paper/10 dark:bg-slate-950 dark:text-paper/60">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i} className="odd:bg-ink/[0.015] dark:odd:bg-paper/[0.02]">
                    <td className="px-4 py-2.5 font-mono text-ink/60 dark:text-paper/60">{s.source_row_index}</td>
                    <td className="px-4 py-2.5 text-signal-bad">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {skipped.length === 0 && <EmptyState message="Nothing was skipped — every row had an email or mobile number." />}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  tone: "good" | "bad";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-ink text-paper dark:bg-paper dark:text-ink"
          : "bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-paper/5 dark:text-paper/60 dark:hover:bg-paper/10"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 font-mono text-xs ${
          active
            ? tone === "good"
              ? "bg-signal-good/20 text-signal-good"
              : "bg-signal-bad/20 text-signal-bad"
            : "bg-ink/10 dark:bg-paper/10"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-10 text-center text-sm text-ink/40 dark:text-paper/40">{message}</p>;
}
