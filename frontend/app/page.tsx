"use client";

import { useState } from "react";
import Papa from "papaparse";
import Dropzone from "@/components/Dropzone";
import PreviewTable from "@/components/PreviewTable";
import ResultsTable from "@/components/ResultsTable";
import ProgressBar from "@/components/ProgressBar";
import ThemeToggle from "@/components/ThemeToggle";
import { importRows, ApiError } from "@/lib/api";
import { downloadCrmRecordsAsCsv } from "@/lib/csvExport";
import type { ImportResponse, RawRow } from "@/lib/types";

// the 4 steps of the import flow
type Step = "upload" | "preview" | "processing" | "results";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  // step 1 -> step 2: user picked a file, parse it just to show a preview
  function handleFile(file: File) {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a .csv file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large. Max size is 5MB.");
      return;
    }

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: function (results: any) {
        // drop rows where every column is empty
        const cleanRows = results.data.filter((row: RawRow) => {
          return Object.values(row).some((val) => (val || "").toString().trim() !== "");
        });

        if (cleanRows.length === 0) {
          setUploadError("This CSV doesn't have any usable rows.");
          return;
        }

        setHeaders(results.meta.fields || []);
        setRows(cleanRows);
        setStep("preview");
      },
      error: function (err: any) {
        setUploadError("Could not read this CSV: " + err.message);
      },
    });
  }

  // step 3: user clicked confirm, send rows to backend for AI mapping
  async function handleConfirm() {
    setStep("processing");
    setProcessError(null);

    try {
      const data = await importRows(rows);
      setResult(data);
      setStep("results");
    } catch (err) {
      if (err instanceof ApiError) {
        setProcessError(err.message);
      } else {
        setProcessError("Something went wrong. Please try again.");
      }
      setStep("preview");
    }
  }

  function resetEverything() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setResult(null);
    setUploadError(null);
    setProcessError(null);
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI-powered CSV Importer</h1>
          <p className="text-sm text-gray-500">Upload a CSV file and let AI map it into the CRM format.</p>
        </div>
        <ThemeToggle />
      </div>

      {step === "upload" && <Dropzone onFileAccepted={handleFile} error={uploadError} />}

      {step === "preview" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-gray-500">{rows.length} rows, {headers.length} columns</p>
            </div>
            <div className="flex gap-2">
              <button onClick={resetEverything} className="px-4 py-2 rounded-full border text-sm">
                Cancel
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm">
                Confirm import ({rows.length} rows)
              </button>
            </div>
          </div>

          {processError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{processError}</p>
          )}

          <PreviewTable headers={headers} rows={rows} />
        </div>
      )}

      {step === "processing" && (
        <ProgressBar label={"Mapping " + rows.length + " rows with AI..."} />
      )}

      {step === "results" && result && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500">Total rows</p>
              <p className="text-2xl font-bold">{result.totalRows}</p>
            </div>
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500">Imported</p>
              <p className="text-2xl font-bold text-green-600">{result.totalImported}</p>
            </div>
            <div className="border rounded-xl p-4">
              <p className="text-xs text-gray-500">Skipped</p>
              <p className="text-2xl font-bold text-red-600">{result.totalSkipped}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => downloadCrmRecordsAsCsv(result.imported, fileName.replace(".csv", "") + "_crm_import.csv")}
              disabled={result.imported.length === 0}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm disabled:opacity-40"
            >
              Download CSV ({result.imported.length})
            </button>
            <button onClick={resetEverything} className="px-4 py-2 rounded-full border text-sm">
              Import another file
            </button>
          </div>

          <ResultsTable imported={result.imported} skipped={result.skipped} />
        </div>
      )}
    </main>
  );
}
