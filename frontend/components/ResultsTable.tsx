"use client";

import { useState } from "react";
import type { CrmRecord, SkippedRecord } from "@/lib/types";

// the columns we show in the results table, in a sensible order
const COLUMNS = [
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

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-gray-300">-</span>;
  }

  let color = "bg-gray-100 text-gray-600";
  if (status === "GOOD_LEAD_FOLLOW_UP") color = "bg-green-100 text-green-700";
  if (status === "SALE_DONE") color = "bg-blue-100 text-blue-700";
  if (status === "BAD_LEAD") color = "bg-red-100 text-red-700";
  if (status === "DID_NOT_CONNECT") color = "bg-yellow-100 text-yellow-700";

  return <span className={"px-2 py-1 rounded text-xs font-medium " + color}>{status}</span>;
}

export default function ResultsTable({ imported, skipped }: { imported: CrmRecord[]; skipped: SkippedRecord[] }) {
  const [activeTab, setActiveTab] = useState<"imported" | "skipped">("imported");

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab("imported")}
          className={
            "px-4 py-2 rounded-full text-sm font-medium " +
            (activeTab === "imported" ? "bg-black text-white" : "bg-gray-100")
          }
        >
          Imported ({imported.length})
        </button>
        <button
          onClick={() => setActiveTab("skipped")}
          className={
            "px-4 py-2 rounded-full text-sm font-medium " +
            (activeTab === "skipped" ? "bg-black text-white" : "bg-gray-100")
          }
        >
          Skipped ({skipped.length})
        </button>
      </div>

      {activeTab === "imported" && (
        <div className="border rounded-xl overflow-auto max-h-[480px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col} className="sticky top-0 bg-white border-b px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imported.map((record, i) => (
                <tr key={i} className="border-b">
                  {COLUMNS.map((col) => {
                    const value = (record as any)[col];
                    return (
                      <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[220px] truncate">
                        {col === "crm_status" ? (
                          <StatusBadge status={record.crm_status} />
                        ) : value ? (
                          value
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {imported.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No records were imported.</p>
          )}
        </div>
      )}

      {activeTab === "skipped" && (
        <div className="border rounded-xl overflow-auto max-h-[480px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 bg-white border-b px-3 py-2 text-left text-xs font-semibold text-gray-600">Row #</th>
                <th className="sticky top-0 bg-white border-b px-3 py-2 text-left text-xs font-semibold text-gray-600">Reason</th>
              </tr>
            </thead>
            <tbody>
              {skipped.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{item.source_row_index}</td>
                  <td className="px-3 py-2 text-red-600">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {skipped.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nothing was skipped.</p>
          )}
        </div>
      )}
    </div>
  );
}
